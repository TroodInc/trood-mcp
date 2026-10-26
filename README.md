# Trood MCP

Version 0.3. Licensed under the Apache License 2.0 (see LICENSE).

Trood for your coding agent. The agent writes the code; Trood takes care of the environment around it and of the people: putting a project online (GitHub, Vercel, Railway), secrets, domains, the systems a business runs, choosing technologies, and finding help. Help adapts per area, from a guided walkthrough for beginners to facts only for pros, and it never repeats an offer you turned down.

It also researches a company and prepares a precise offer for it with your own model, on your own tokens, and reads your Trood work: Product Engine projects, the goals and decisions recorded for your company, and the public Technology Tree.

Trood pays for no model calls. Your credentials and research stay on your computer.

## Install

Not on npm yet: until it is, use the local install below.

Claude Code, as a plugin (bundles the server, the `/trood:start` and `/trood:launch` commands, and a skill that routes environment questions to Trood):

```
/plugin marketplace add <owner>/<repo>
/plugin install trood@trood
```

If you connected the older `trood` server by hand, remove it first so there is only one: `claude mcp remove trood`.

Any MCP client, with npx:

```bash
claude mcp add trood -- npx -y @trood/mcp
```

Claude Desktop, in `claude_desktop_config.json`:

```json
{ "mcpServers": { "trood": { "command": "npx", "args": ["-y", "@trood/mcp"] } } }
```

Local install, from this repository:

```bash
cd trood-platform-back/mcp
npm install && npm run build && npm link   # makes the `trood-mcp` command available
claude mcp add trood -- trood-mcp
```

Sign in (optional; Tree, levels and tell_trood work signed out):

```bash
trood-mcp login      # your Trood email and password; the session lasts about a day
```

Then run `/trood:start` in Claude Code (or the `start` prompt in other clients) to set Trood up for a project.

## Usage analytics, only if you say yes

Trood asks once: "May Trood record which Trood tools you use and whether they worked, so we can improve them? Never your code, files, documents or anything you type." Until you answer yes, nothing is sent.

- What is sent: the tool or prompt name, its area and help level, whether it worked, how long it took, your MCP client and its version, your OS family and this server's version. Signed in, it is tied to your Trood account; signed out, it is anonymous.
- What is never sent: tool arguments, file paths, repository or company names, code, document contents.
- See what was sent: the `show_my_trood_data` tool, or `~/.trood/telemetry.jsonl`.
- Change your answer: ask your agent ("Trood, stop sending usage"), or `trood-mcp analytics no`.
- `DO_NOT_TRACK=1` or `TROOD_TELEMETRY=0` always wins: nothing is sent.

`tell_trood` is different: it sends a message you choose to send, so it works whatever your analytics answer is.

## Help levels

Per area, per project: `launch`, `secrets`, `domains`, `estate`, `checks`, `watch`, `technology`, `help`, `tutorials`. Each is `guide` (explain and walk through), `hint` (one line, the default) or `quiet` (facts only, speaks only when a check fails). Say "stop explaining deploys" or "walk me through domains" and the agent changes it. Saved in `~/.trood/projects/`, keyed by a hash of the project's git remote; nothing about the project leaves your computer.

## Tools

Trood itself:

| Tool | What it does |
|---|---|
| `trood_whoami` | Who you are, your roles, your workspaces on platform.trood.com and which is active, and your analytics answer. Works signed out |
| `use_workspace` | Chooses the active workspace on this computer |
| `get_trood_levels`, `set_trood_level` | Help levels per area; offers you declined |
| `decline_offer` | Remembers a no, so it is not offered again |
| `set_trood_analytics`, `show_my_trood_data` | Your analytics answer, and what was sent |
| `tell_trood` | A request, idea or complaint in your own words, to Trood's team |
| `get_claude_md_block` | A short block for your project's CLAUDE.md (beginner or pro), so every session knows when to use Trood. Added only with your yes |

Prompts: `start` (set Trood up for a project) and `launch` (put a project online with GitHub, Vercel and Railway; the agent runs the commands, you do only the steps that need you).

Research and offers:

| Tool | What it does |
|---|---|
| `research_company` | Reads a company's website (home page and up to three of its own pages), detects booking engine, sales channels, guest messaging, website system, payments; records them as facts with their source page; returns the page text for your model to read, labelled untrusted |
| `add_fact` | Records a fact with the page it came from. Only facts from pages that were read; nothing about people (names, emails, phone numbers are refused) |
| `get_catalog` | The options an offer is built from, per industry: the platform's 20 industry packs (hotels, restaurants, clinics and more). Without an industry, the list of packs; prices are placeholders you set |
| `list_companies`, `get_company` | What you researched, with suggested options (by rule, no model) |
| `draft_offer` | Writes the brief: headline, what you heard, chosen facts with sources, options with your prices. Saved locally; nothing is sent |
| `publish_offer` | After the person approves the brief (`confirm: true`), it goes to the Trood Platform. A Trood operator gets a Trood offer with its private link straight away. A partner's offer goes to Trood to check, with their Product Engine referral code: Trood creates the link and emails it to them, and they earn 10% of what the business pays in its first 12 months. Trood prices it from its own price list and delivers the work |
| `list_my_offers` | A partner's offers on Trood: being checked, declined, or the link, and whether the company opened or started it. Never what the company told Trood |

Your Trood work:

| Tool | What it does |
|---|---|
| `list_projects` | Your projects and their status |
| `get_project` | One project: stages, amounts, payments |
| `get_project_context` | The project's goals, constraints, decisions and principles |
| `get_company_context` | Your company's goals, constraints, decisions and principles |
| `get_project_messages` | The project's thread |
| `get_updates` | What happened recently across your projects |
| `get_project_topology` | What the project is built from (Ontop) |
| `add_project_context` | Records a goal, decision or principle |
| `search_tree`, `get_technology` | The public Technology Tree; no sign-in needed |

Analytics, for Trood admins only (anyone else gets "you do not have access"):

| Tool | What it does |
|---|---|
| `get_traffic` | Every Trood site, from first-party analytics: visits, page views, sources, top pages, named steps, devices, a funnel per site, the latest events. A visit is one visitor on one day; no cookies, nothing that identifies a person. `days`, `product` |
| `get_user_activity` | Signed-in activity: users, new and active, event counts, engagement, activity per day, weekly retention. `days`, `weeks` |

Never through this MCP: sending anything to a company or customer, approving, paying, granting or revoking access, changing rules, or moving a project's state. Contact details and payment links are removed before Engine results reach the model.

Where research lives: `~/.trood/companies/<domain>.json` and `<domain>.brief.md`, readable by you only. Nobody else, Trood included, sees which companies you researched or what you inferred. Website fetching refuses local and private addresses, follows at most three redirects, and caps size and time (ported from Growth's page probe).

## How it is built

- A plain TypeScript package on the official MCP SDK, not NestJS (ADR-014's stack for the platform API): it has no database and no routes of its own, so a framework would add nothing. It can be mounted in the NestJS service when that exists.
- Usage events go to trood-identity's collector: signed in to `POST /users/me/events`, signed out to `POST /public/e` with product `mcp`. Messages from `tell_trood` go to the platform API (`POST /mcp/tell`), into Trood's event log and feed.
- Sign-in goes through trood-identity (`POST /auth/login`), as ADR-014 requires; the session token is the Kratos session Product Engine accepts as a bearer. It is stored in `~/.trood/mcp-session.json`, readable by you only, or taken from `TROOD_SESSION_TOKEN`.
- Service addresses can be overridden: `TROOD_IDENTITY_URL`, `TROOD_ENGINE_URL`, `TROOD_TREE_URL`, `TROOD_PLATFORM_URL`.

## Check

```bash
npm run build && npm run check
```

Runs the server under the SDK's own client: 61 checks. A fixture website ("Sample Retreat", with an injected instruction in its text) and a local Product Engine stub cover research, facts, privacy refusals, the brief, publishing and a Partner's 403; live calls cover the Technology Tree, a public website and a Product Engine refusal.

## Not yet

- A hosted connector for claude.ai needs OAuth in front of Trood's login; Kratos alone does not provide it.
- The shared facts cache (one company researched once, across providers) needs the platform's server; today each provider's research is their own.
- Providers' own catalogs: the catalog is Trood's industry packs (a generated copy of `api/src/catalog/packs.ts`; after changing that file run `node scripts/sync-packs.mjs`, and `npm run check` fails until you do) until the platform stores providers' catalogs.
- `run_trood_analysis`, Trood's paid analysis for Pro, is not built.
- Outside providers: Product Engine's operator role sees every project, so v0.1 is for Trood's own team until operators are scoped to their own projects.
