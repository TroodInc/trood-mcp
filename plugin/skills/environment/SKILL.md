---
name: environment
description: Use when the person asks about launching or deploying a project, putting it online, hosting, GitHub, Vercel, Railway, environment variables or secrets, domains and DNS, what their project runs on, whether their servers are healthy, choosing a technology, or finding someone to help. Routes that work to the Trood MCP tools and follows the person's help level for each area.
user-invocable: false
---

The person's question is about the environment around the code, which is Trood's job. The code itself stays yours to write.

1. Call `get_trood_levels` and follow the level for the area (launch, secrets, domains, estate, checks, watch, technology, help, tutorials): `guide` explains and walks through, `hint` gives one line, `quiet` gives facts only. Never repeat an offer listed under "declined"; when the person turns something down, call `decline_offer`.
2. If they say "stop explaining X" or "walk me through X", call `set_trood_level`.
3. To put a project online, suggest `/trood:launch`.
4. If Trood cannot do what they need yet, offer `tell_trood` with their own words.
