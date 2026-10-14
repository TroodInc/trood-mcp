# Trood MCP

Version 0.1. Your Trood work, from Claude: your Product Engine projects with their stages and payments, the goals and decisions recorded for your company and projects, project messages and updates, and the public Technology Tree.

It runs on your computer and speaks to Claude Desktop or Claude Code over stdio. User manual (the whole platform, and this MCP): https://claude.ai/artifact/H88uCbMjWqs1aRWSPFxmU4

## Install

```bash
cd trood-platform-back/mcp
npm install
npm run build
npm link            # makes the `trood-mcp` command available
trood-mcp login     # your Trood email and password; the session lasts about a day
```

## Connect

Claude Code:

```bash
claude mcp add trood -- trood-mcp
```

Claude Desktop, in `claude_desktop_config.json`:

```json
{ "mcpServers": { "trood": { "command": "trood-mcp" } } }
```

## Tools

| Tool | What it does |
|---|---|
| `trood_whoami` | Who you are on Trood, and your roles |
| `list_projects` | Your projects and their status |
| `get_project` | One project: stages, amounts, payments |
| `get_project_context` | The project's goals, constraints, decisions and principles |
| `get_company_context` | Your company's goals, constraints, decisions and principles |
| `get_project_messages` | The project's thread |
| `get_updates` | What happened recently across your projects |
| `get_project_topology` | What the project is built from (Ontop) |
| `add_project_context` | Records a goal, decision or principle. The only write |
| `search_tree`, `get_technology` | The public Technology Tree; no sign-in needed |

Never through this MCP: sending messages, approving, paying, granting or revoking access, changing rules, or moving a project's state. Contact details and payment links are removed before results reach the model.

## How it is built

- A plain TypeScript package on the official MCP SDK, not NestJS (ADR-014's stack for the platform API): it has no database and no routes of its own, so a framework would add nothing. It can be mounted in the NestJS service when that exists.
- Sign-in goes through trood-identity (`POST /auth/login`), as ADR-014 requires; the session token is the Kratos session Product Engine accepts as a bearer. It is stored in `~/.trood/mcp-session.json`, readable by you only, or taken from `TROOD_SESSION_TOKEN`.
- Service addresses can be overridden: `TROOD_IDENTITY_URL`, `TROOD_ENGINE_URL`, `TROOD_TREE_URL`.

## Check

```bash
npm run build && npm run check
```

Runs the server under the SDK's own client: 24 checks against a local Product Engine stub (tools, the one write, redaction, sessions), plus the live Technology Tree and a live Product Engine refusal.

## Not yet

- A hosted connector for claude.ai needs OAuth in front of Trood's login; Kratos alone does not provide it.
- Offer prefill for Partners (`draft_offer`, `add_fact`, `get_catalog`) needs the platform's own store for offers and facts, which does not exist yet.
- Outside providers: Product Engine's operator role sees every project, so v0.1 is for Trood's own team until operators are scoped to their own projects.
