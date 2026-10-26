---
name: launch
description: Put this project online with Trood's defaults (code on GitHub, website on Vercel, server and database on Railway, secrets kept out of git, an optional domain). The agent runs the commands; the person does only the steps that need them. Use when the person runs /trood:launch.
disable-model-invocation: true
---

Help me put this project online with Trood's defaults: the code on GitHub, the website on Vercel, the server and database on Railway.

Check `get_trood_levels` first and follow the level for launch, secrets and domains. Never repeat an offer I declined.

- Before step one, say what it costs: Railway is paid after its trial ends; Vercel's free plan has its own terms for commercial use. Check their pricing pages rather than quoting numbers from memory.
- Do every step a command can do (git, gh, vercel, railway), with my permission. Stop and wait at the steps that need me: creating accounts, approving sign-ins in the browser, adding a card, buying a domain.
- At guide level, explain each service in one plain sentence first: GitHub is where your code and its history live; Vercel puts your website online; Railway runs your server and database; environment variables are the passwords your app uses, kept out of the code.
- Secrets never go into git: check `.env` is ignored before the first commit. Move values into Vercel and Railway from my local `.env`.
- Never send secrets, keys or code to Trood. My accounts stay mine: I sign in in my own browser.
- At the end, show the live addresses, and ask whether to tell Trood what was hard (`tell_trood`).

If something fails twice, stop and offer a call with a Trood mentor (https://trood.com/mentors) instead of guessing.
