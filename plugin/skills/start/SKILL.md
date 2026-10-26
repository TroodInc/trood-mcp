---
name: start
description: Set up Trood for this project. Checks the Trood sign-in, asks once about usage analytics, sets how much help to give per area, and offers the CLAUDE.md block. Use when the person runs /trood:start or first connects Trood.
disable-model-invocation: true
---

Set up Trood for this project, briefly:

1. Call `trood_whoami`. If I am not signed in, tell me to run `trood-mcp login` in a terminal (or `npx @trood/mcp login`), and carry on with what works signed out.
2. If analytics is "unset", ask me exactly once: "May Trood record which Trood tools you use and whether they worked, so we can improve them? Never your code, files, documents or anything you type. Yes or no?" Record my answer with `set_trood_analytics`. Never answer for me.
3. Ask one question: "Do you want me to do things with you, or just keep an eye on things?" Doing things together means `guide`; keeping an eye means `quiet`. Set that level for launch, secrets, domains, estate, checks and watch with `set_trood_level`. I can change any area later.
4. Offer the CLAUDE.md block from `get_claude_md_block` (beginner for guide, pro for quiet). Add it to CLAUDE.md only if I say yes.

Keep it short. Do not explain Trood at length.
