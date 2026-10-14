# Trood MCP

Version 0.2. Research a company and prepare a precise offer for it with your own Claude, on your own tokens: read its website, see what it runs on, record facts with their sources, match catalog options, draft the brief, and publish it as a private link. Trood pays for no model calls; the research stays on your computer.

It also reads your Trood work: your Product Engine projects with their stages and payments, the goals and decisions recorded for your company and projects, project messages and updates, and the public Technology Tree.

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

Research and offers:

| Tool | What it does |
|---|---|
| `research_company` | Reads a company's website (home page and up to three of its own pages), detects booking engine, sales channels, guest messaging, website system, payments; records them as facts with their source page; returns the page text for your model to read, labelled untrusted |
| `add_fact` | Records a fact with the page it came from. Only facts from pages that were read; nothing about people (names, emails, phone numbers are refused) |
| `get_catalog` | The options an offer is built from. Templates so far: hotels and retreats; prices are placeholders you set |
| `list_companies`, `get_company` | What you researched, with suggested options (by rule, no model) |
| `draft_offer` | Writes the brief: headline, what you heard, chosen facts with sources, options with your prices. Saved locally; nothing is sent |
| `publish_offer` | After the person approves the brief (`confirm: true`): a Product Engine draft project with one stage per option and a private link, valid 30 days. Needs a Trood operator account; a Partner sends the saved brief instead |

Your Trood work:

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
- Sign-in goes through trood-identity (`POST /auth/login`), as ADR-014 requires; the session token is the Kratos session Product Engine accepts as a bearer. It is stored in `~/.trood/mcp-session.json`, readable by you only, or taken from `TROOD_SESSION_TOKEN`.
- Service addresses can be overridden: `TROOD_IDENTITY_URL`, `TROOD_ENGINE_URL`, `TROOD_TREE_URL`.

## Check

```bash
npm run build && npm run check
```

Runs the server under the SDK's own client: 46 checks. A fixture website ("Sample Retreat", with an injected instruction in its text) and a local Product Engine stub cover research, facts, privacy refusals, the brief, publishing and a Partner's 403; live calls cover the Technology Tree, a public website and a Product Engine refusal.

## Not yet

- A hosted connector for claude.ai needs OAuth in front of Trood's login; Kratos alone does not provide it.
- The shared facts cache (one company researched once, across providers) needs the platform's server; today each provider's research is their own.
- Providers' own catalogs: the catalog is Trood's hotel templates until the platform stores providers' catalogs.
- `run_trood_analysis`, Trood's paid analysis for Pro, is not built.
- Outside providers: Product Engine's operator role sees every project, so v0.1 is for Trood's own team until operators are scoped to their own projects.
