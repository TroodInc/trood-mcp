import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { engine, platform, TroodError } from './http.js';
import { AREAS, decline, DEFAULT_LEVEL, LEVEL_MEANING, LEVELS, levelOf, readGlobal, readProject, setLevel, writeGlobal, type Area, type Level } from './prefs.js';
import { readSession } from './session.js';
import { pendingSignIn, pollOnce, startSignIn, waitForApproval } from './device.js';
import { config } from './config.js';
import { consent, envBlocks, MCP_VERSION, readLog, track } from './telemetry.js';

/**
 * The Trood MCP's own controls (phase 0 of trood-brain
 * products/trood-platform-ai-and-mcp.md, "Proposal: the MCP for developers"):
 * who you are and which workspace, help levels per area, the analytics answer,
 * telling Trood what you need, and the CLAUDE.md block that routes work to
 * Trood in every session. Plus the `start` and `launch` prompts.
 */

type Result = { content: { type: 'text'; text: string }[]; isError?: boolean };
const json = (data: unknown): Result => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const fail = (s: string): Result => ({ content: [{ type: 'text', text: s }], isError: true });
async function run(fn: () => Promise<Result> | Result): Promise<Result> {
  try { return await fn(); }
  catch (err) { return fail(err instanceof TroodError ? err.message : `Unexpected error: ${(err as Error).message}`); }
}

const LOCAL = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const area = z.enum(AREAS).describe(`One of: ${AREAS.join(', ')}`);
const level = z.enum(LEVELS).describe('guide (explain and walk through), hint (one line), quiet (facts only)');

export const CONSENT_QUESTION =
  'May Trood record which Trood tools you use and whether they worked, so we can improve them? Never your code, files, documents or anything you type. Yes or no?';

/** The block the person adds to their project's CLAUDE.md, so every session knows how to use Trood. */
export function claudeMdBlock(variant: 'beginner' | 'pro'): string {
  const common = [
    '## Trood',
    '',
    'This project is connected to Trood (the `trood` MCP server). Its records live on platform.trood.com: the systems it runs, decisions, documents and check history.',
    '',
  ];
  const beginner = [
    '- For launching, deploys, secrets, domains, weekly checks, choosing technologies and finding help, use the Trood tools first. Write the code yourself.',
    '- Explain each step in plain words. Do what can be done with commands; stop and wait at the steps that need me (creating accounts, approving sign-ins, paying).',
    '- When I hesitate, offer a tutorial or a call with a Trood mentor.',
    '- Respect the help level for each area (`get_trood_levels`); if I say "stop explaining X", call `set_trood_level`.',
  ];
  const pro = [
    '- Use Trood only for the estate (what runs where), checks, the weekly watch and requests for help (`tell_trood`, and later `request_help`). Do not offer tutorials.',
    '- Keep Trood output to facts. Raise something only when a check fails.',
    '- Respect the help level for each area (`get_trood_levels`).',
  ];
  return [...common, ...(variant === 'beginner' ? beginner : pro), ''].join('\n');
}

/** Which area a tool belongs to, for its help level and the analytics event. */
export const TOOL_AREAS: Record<string, Area> = {
  search_tree: 'technology',
  get_technology: 'technology',
  tell_trood: 'help',
};

export function levelNote(a: Area): string {
  const l = levelOf(a);
  return `Trood help level for ${a}: ${l} (${LEVEL_MEANING[l]}).`;
}

interface Me {
  person?: { id: string; name: string | null };
  workspaces?: { id: string; kind: string; name: string; role: string; status: string }[];
}

export function registerTroodTools(server: McpServer): void {
  server.registerTool('trood_whoami', {
    title: 'Who am I on Trood',
    description: 'The signed-in person: name, roles in Product Engine, their workspaces on platform.trood.com and which one is active, and whether usage analytics are on. Use it first to check the session works.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  }, () => run(async () => {
    if (!readSession()) {
      return json({ signedIn: false, howToSignIn: 'Ask me to sign you in (trood_sign_in), or run `npx @troodinc/mcp login` in a terminal.', analytics: consent(), version: MCP_VERSION });
    }
    const errors: string[] = [];
    const [user, me] = await Promise.all([
      engine('/users/me').catch((e: Error) => { errors.push(e.message); return null; }) as Promise<{ name?: string; roles?: string[] } | null>,
      platform('/me').catch((e: Error) => { errors.push(e.message); return null; }) as Promise<Me | null>,
    ]);
    // A saved but expired session is not a sign-in: say so, rather than an empty profile.
    if (!user && !me) {
      return json({ signedIn: false, reason: errors[0] ?? 'Trood did not recognise the saved session.', howToSignIn: 'Ask me to sign you in (trood_sign_in), or run `npx @troodinc/mcp login` in a terminal.', analytics: consent(), version: MCP_VERSION });
    }
    const workspaces = me?.workspaces ?? [];
    const savedId = readGlobal().activeWorkspaceId;
    const active = workspaces.find((w) => w.id === savedId) ?? workspaces.find((w) => w.kind === 'business') ?? workspaces[0] ?? null;
    return json({
      signedIn: true,
      name: user?.name ?? me?.person?.name ?? null,
      roles: user?.roles ?? [],
      workspaces,
      activeWorkspace: active,
      platform: 'https://platform.trood.com',
      analytics: consent(),
      version: MCP_VERSION,
    });
  }));

  server.registerTool('trood_sign_in', {
    title: 'Sign in to Trood through the browser',
    description: 'Starts a sign-in the person approves in their own browser on platform.trood.com: returns a link and a short code. Show both to the person, ask them to open the link, check the code matches and approve, then call trood_sign_in_status. Never ask for their password. The sign-in lasts 90 days and can be disconnected from their page on the platform.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, () => run(async () => {
    const s = await startSignIn();
    return json({ link: s.link, code: s.userCode, expiresInMinutes: Math.round((s.expiresAt - Date.now()) / 60000), next: 'Ask the person to open the link, check the code and approve; then call trood_sign_in_status.' });
  }));

  server.registerTool('trood_sign_in_status', {
    title: 'Finish signing in to Trood',
    description: 'Checks whether the person approved the sign-in started with trood_sign_in, waiting up to about 25 seconds. On approval this computer is signed in. If it is still pending, ask the person whether they approved, then call it again.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, () => run(async () => {
    if (!pendingSignIn()) return json({ signedIn: Boolean(readSession()), note: readSession() ? 'Already signed in.' : 'No sign-in is waiting. Start one with trood_sign_in.' });
    const first = await pollOnce();
    const result = first.state === 'pending' ? await waitForApproval(25_000) : first;
    if (result.state === 'approved') return json({ signedIn: true, note: 'Signed in. It lasts 90 days; the person can disconnect it under Connected tools on platform.trood.com/me.' });
    if (result.state === 'pending') return json({ signedIn: false, pending: true, note: 'Not approved yet. Ask the person whether they approved on the page, then call this again.' });
    return fail(result.reason);
  }));

  server.registerTool('use_workspace', {
    title: 'Choose the active workspace',
    description: 'Sets which of the person\'s platform.trood.com workspaces Trood works in on this computer. Get the ids from trood_whoami.',
    inputSchema: { workspaceId: z.string().uuid().describe('A workspace id from trood_whoami') },
    annotations: LOCAL,
  }, ({ workspaceId }) => run(async () => {
    const me = (await platform('/me')) as Me;
    const ws = (me.workspaces ?? []).find((w) => w.id === workspaceId);
    if (!ws) return fail('That workspace is not one of yours. Use an id from trood_whoami.');
    writeGlobal({ activeWorkspaceId: ws.id });
    return json({ activeWorkspace: ws });
  }));

  server.registerTool('get_trood_levels', {
    title: 'How much Trood should help, per area',
    description: `The help level for each area in this project: guide, hint or quiet (default ${DEFAULT_LEVEL}), and the offers the person turned down. Check it before offering help, explanations or tutorials, and never repeat a declined offer.`,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, () => run(() => {
    const p = readProject();
    const levels = Object.fromEntries(AREAS.map((a) => [a, p.levels[a] ?? DEFAULT_LEVEL]));
    return json({ levels, meaning: LEVEL_MEANING, declined: p.declined });
  }));

  server.registerTool('set_trood_level', {
    title: 'Change how much Trood helps in one area',
    description: 'Use when the person says something like "stop explaining deploys" (quiet), "just give me hints about secrets" (hint) or "walk me through domains" (guide). Saved on this computer for this project.',
    inputSchema: { area, level },
    annotations: LOCAL,
  }, ({ area: a, level: l }) => run(() => {
    setLevel(a as Area, l as Level);
    track('mcp_level', { area: a, level: l });
    return json({ area: a, level: l, meaning: LEVEL_MEANING[l as Level] });
  }));

  server.registerTool('decline_offer', {
    title: 'Remember that the person said no',
    description: 'Call it when the person turns down something Trood offered (a tutorial, a walkthrough, a check), so it is not offered again in this project.',
    inputSchema: {
      area,
      kind: z.string().min(2).max(40).describe('What was declined, in a word or two, for example "tutorial" or "domain walkthrough"'),
    },
    annotations: LOCAL,
  }, ({ area: a, kind }) => run(() => {
    const p = decline(a as Area, kind);
    track('mcp_declined', { area: a });
    return json({ declined: p.declined });
  }));

  server.registerTool('set_trood_analytics', {
    title: 'Answer whether Trood may record usage',
    description: `Records the person's answer to: "${CONSENT_QUESTION}" Only call it with what the person actually said. They can change it at any time ("Trood, stop sending usage").`,
    inputSchema: { answer: z.enum(['yes', 'no']).describe("The person's answer") },
    annotations: LOCAL,
  }, ({ answer }) => run(() => {
    writeGlobal({ analytics: answer, analyticsAnsweredAt: new Date().toISOString() });
    return json({
      analytics: consent(),
      note: envBlocks() ? 'DO_NOT_TRACK or TROOD_TELEMETRY=0 is set on this computer, so nothing is sent whatever the answer.' : answer === 'yes'
        ? 'Thank you. Only tool names, areas, levels, outcomes and timings are sent; show_my_trood_data lists them.'
        : 'Nothing will be sent.',
    });
  }));

  server.registerTool('show_my_trood_data', {
    title: 'What Trood has recorded from this computer',
    description: 'The analytics answer and the last events sent from this computer, from a local log. Use it when the person asks what Trood knows about their usage.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, () => run(() => json({ analytics: consent(), lastEvents: readLog().slice(-50) })));

  server.registerTool('tell_trood', {
    title: 'Tell Trood what you need',
    description: 'Sends Trood a request, idea or complaint in the person\'s own words: a missing feature, something that did not work, help they need. Use it when the person wants Trood to know something, or agrees when you suggest it. Never include secrets, code or other people\'s details. Works whatever the analytics answer is.',
    inputSchema: {
      text: z.string().min(3).max(2000).describe("The message, in the person's words"),
      area: area.optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, ({ text, area: a }) => run(async () => {
    const session = readSession();
    const res = await fetch(`${config.platformUrl}/mcp/tell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': `trood-mcp/${MCP_VERSION}`, ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
      body: JSON.stringify({ text, area: a }),
      signal: AbortSignal.timeout(config.timeoutMs),
    }).catch((err) => { throw new TroodError(`Could not reach Trood: ${(err as Error).message}`); });
    if (res.status === 429) return fail('Trood has had a lot of messages from here this hour. Try later, or write to community@trood.com.');
    if (!res.ok) return fail(`Trood did not take the message (HTTP ${res.status}). Write to community@trood.com instead.`);
    return json({ sent: true, note: 'Trood reads these. Signed in, they can reply through your account.' });
  }));

  server.registerTool('get_claude_md_block', {
    title: 'The Trood block for CLAUDE.md',
    description: "A short block to add to the project's CLAUDE.md so every session knows when to use Trood and how much to say. 'beginner' routes most environment questions to Trood; 'pro' keeps Trood to facts. Show it to the person and add it only with their yes; Trood never edits files itself.",
    inputSchema: { variant: z.enum(['beginner', 'pro']).describe('beginner or pro') },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, ({ variant }) => run(() => ({ content: [{ type: 'text', text: claudeMdBlock(variant) }] })));

  server.registerPrompt('start', {
    title: 'Set up Trood for this project',
    description: 'First run: check the sign-in, ask once about usage analytics, set how much help to give, and offer the CLAUDE.md block.',
  }, () => {
    track('mcp_prompt', { prompt: 'start' });
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Set up Trood for this project, briefly:',
            '1. Call trood_whoami. If I am not signed in, offer to sign me in with trood_sign_in (I approve it in my browser); if I prefer not to, continue with what works signed out.',
            `2. If analytics is "unset", ask me exactly this once: "${CONSENT_QUESTION}" and record my answer with set_trood_analytics. Do not ask again.`,
            '3. Ask one question: "Do you want me to do things with you, or just keep an eye on things?" Doing things together means guide; keeping an eye means quiet. Set that level for launch, secrets, domains, estate, checks and watch with set_trood_level. I can change any area later.',
            '4. Offer the CLAUDE.md block (get_claude_md_block, beginner for guide, pro for quiet). Add it to CLAUDE.md only if I say yes.',
            'Keep it short. Do not explain Trood at length.',
          ].join('\n'),
        },
      }],
    };
  });

  server.registerPrompt('launch', {
    title: 'Put my project online',
    description: 'A guided launch: GitHub, Vercel, Railway, secrets and a domain. The agent runs the commands; you do only the steps that need you.',
  }, () => {
    track('mcp_prompt', { prompt: 'launch' });
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Help me put this project online with Trood\'s defaults: the code on GitHub, the website on Vercel, the server and database on Railway.',
            'Check get_trood_levels first and follow the level for "launch", "secrets" and "domains". Never repeat an offer I declined.',
            'Rules:',
            '- Before step one, say what it costs: Railway is paid after its trial ends; Vercel\'s free plan has its own terms for commercial use. Check their pricing pages rather than quoting numbers from memory.',
            '- Do every step a command can do (git, gh, vercel, railway), with my permission. Stop and wait at the steps that need me: creating accounts, approving sign-ins in the browser, adding a card, buying a domain.',
            '- At guide level, explain each service in one plain sentence first: GitHub is where your code and its history live; Vercel puts your website online; Railway runs your server and database; environment variables are the passwords your app uses, kept out of the code.',
            '- Secrets never go into git: check .env is ignored before the first commit. Move values into Vercel and Railway from my local .env.',
            '- Never send secrets, keys or code to Trood. My accounts stay mine: I sign in in my own browser.',
            '- At the end, show the live addresses, and ask whether to tell Trood what was hard (tell_trood).',
            'If something fails twice, stop and offer a call with a Trood mentor (trood.com/mentors) instead of guessing.',
          ].join('\n'),
        },
      }],
    };
  });
}
