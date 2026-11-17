# Steering — Product

Séance is a developer tool with a Halloween soul. Its job: make dead code
visible and give the developer a safe, reversible way to deal with it.

## Product principles

1. **Honesty over magic.** Every claim in the UI must be true about what the
   analyser can actually see. If the analysis is heuristic, say so. If a
   safety rating is conservative, say why. Never present a guess as a fact.
2. **No data leaves the machine.** Pasted and uploaded code is analysed
   locally. The only network call is the optional GitHub-URL fetch, and the
   user chooses it explicitly.
3. **Deletion is a decision, not a default.** Séance never deletes anything
   from the user's repo. Burying produces a report; applying it is the
   developer's job, in a pull request, with review.
4. **One click to value.** The demo button must show a full graveyard with no
   setup, no account, no network.
5. **The theme serves the function.** Tombstones, fog and moonlight are not
   decoration on top of a tool — they ARE the interface metaphor. A tombstone
   is a dead item; burying and resurrecting are the two things you do with
   the dead.

## Tone

Playful-haunted, never gimmicky. Short labels, plain language, no fake
mysticism in explanations. The séance explanations are rule-based and say so.
