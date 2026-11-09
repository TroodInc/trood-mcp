# Trood for Claude Code

Trood takes care of the environment around your code while Claude writes it: putting a project online on accounts in your name, secrets, domains, the systems your business runs, choosing technologies, and finding people when you need help. Help adapts per area, from a guided walkthrough for beginners to facts only for pros, and it never repeats an offer you turned down.

## Install

```
/plugin install trood --marketplace TroodInc/trood-mcp
```

## What it adds

- `/trood:start` asks three questions (what you are building, who builds it, what takes most of your time), sets Trood up to match and suggests at most two tools you are missing.
- `/trood:launch` puts a project online with GitHub, Vercel and Railway. You approve each sign-in in your own browser and see every price first.
- `/trood:board` connects your Trello and keeps a private decision board for founders whose code is written by someone else.
- `/trood:squad` sets up a small team of scheduled agents that report in your own Telegram group.
- A skill that routes questions about launching, hosting, secrets, domains and technology choices to Trood.

## Data and the services it talks to

- **Trood** (platform.trood.com, identity.trood.com and Trood's API servers): your Trood projects, company context and offers, only after you sign in, and usage analytics only after you say yes. How Trood keeps data is in its privacy policy: https://trood.com/privacy_policy.
- **Trello** (api.trello.com), only if you connect a decision board, with a token saved on your computer.
- **Telegram** (api.telegram.org), only if you set up the squad, with a bot token saved on your computer.
- **Company websites** you ask it to research, read like a browser would. Facts are about companies, never about people, and contact details are removed.
- **GitHub, Vercel and Railway**, through your own accounts and their command-line tools, when you launch a project.

The plugin runs the Trood MCP server (`@troodinc/mcp`, Apache-2.0). Trood pays for no model calls, and your credentials and research stay on your computer. Signing in is optional: you approve the computer on platform.trood.com, nobody types a password into a chat, and a connected tool can never pay, approve, invite people or send anything for you.

Source: https://github.com/TroodInc/trood-mcp. Website: https://trood.com/mcp.
