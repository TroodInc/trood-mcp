---
name: start
description: Set Trood up for this person and project. Three questions about what they build, who builds it and what takes their time; then help levels, the tools they are missing from Trood's Technology Tree, sign-in and analytics, the CLAUDE.md block, and an offer to list their product. Use when the person runs /trood:start or first connects Trood.
disable-model-invocation: true
---

Set Trood up for me, briefly. Plain words, one question at a time, no jargon, and do not explain Trood at length.

1. **Three questions**, one at a time. If there is a project in this folder, read what it is and what it runs on yourself (README, package files) and skip what you already know.
   - "What are you building, in a sentence?"
   - "Who builds it: you, your own team, or an outside team?"
   - "What takes most of your time right now: the product, the team, or sales?"

2. **Pick the path from the answers.**
   - **I write or read the code myself:** set launch, secrets, domains, estate, checks and watch to `quiet` with `set_trood_level`. Infrastructure follows Trood's cookbook when I ask; do not list tools at me.
   - **Someone else writes the code:** set those areas to `guide`. My business decisions need one place: decisions, priorities, and what the team promised and by when. If I have no such place, offer to set up a decision board in my Trello now (`/trood:board`: `connect_trello`, then `setup_board`). If I say no, call `decline_offer` with area `board` and kind "board". Technology goes on the board only when it changes a business decision: a deadline, a cost or a risk.

3. **Gaps.** For anything I said takes my time or I do not have (a board, talking to the team, email, sales, design, booking calls), look it up with `search_tree` using these words: a board "project management", talking to the team "messaging", email "email", sales "sales", design "design", booking calls "scheduling". Suggest at most one tool per gap, in one line each, saying Trood runs on it too when the Tree links it to Trood. Never suggest replacing something that works. Two suggestions at most in this first run.

4. **Sign-in and analytics.** Call `trood_whoami`. If I am not signed in, offer `trood_sign_in` (I approve in my browser, then call `trood_sign_in_status`); if I prefer not to, carry on signed out. If analytics is "unset", ask exactly once: "May Trood record which Trood tools you use and whether they worked, so we can improve them? Never your code, files, documents or anything you type. Yes or no?" Record my answer with `set_trood_analytics`. Never answer for me.

5. **CLAUDE.md.** Offer the block from `get_claude_md_block` (beginner for guide, pro for quiet). Add it only if I say yes.

6. **Be found.** Check with `search_tree` whether my product is on Trood's Technology Tree. If it is not, offer once: I can list it at platform.trood.com/provide ("It is a product": a name, the website and one line, in my own words), and if I sell a service, on launchpad.trood.com. You publish nothing about my project yourself. If I say no, call `decline_offer` with kind "listing".

7. End with one next step in my words, for what I said takes most of my time.
