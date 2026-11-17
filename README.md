# 🕯️ Séance — Talk to Your Dead Code

> Kiroween 2026 · Category: **Resurrection** · 1st place prize $30,000

Every codebase is haunted by functions nobody calls, exports nobody imports,
and imports nobody uses. **Séance** finds that dead code, lays it out as a
haunted graveyard, and lets you **Bury** it (mark for deletion, with a cleanup
report) or **Resurrect** it (save it to a revival kit as a reusable snippet).

## Run it

No build step, no server, no account. Open `index.html` in a browser, or serve
the folder statically:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Then either paste a public GitHub repo URL, upload code files, paste code, or
press **👻 Try the demo** for a one-click graveyard.

## What it does

- **JavaScript / TypeScript** — AST-based analysis (vendored Acorn parser):
  unused top-level functions, unused exports, unused imports, unreachable code.
- **Python** — heuristic analysis (regex-based, labelled as such in the UI):
  unused top-level functions/classes and imports.
- **Séance explanations** — rule-based text for every tombstone: what the code
  did, why it died, and a deletion-safety rating (Safe / Caution / Risky).
  No LLM call is made; the explanation says so.
- **Bury / Resurrect / Export** — mark items for deletion, save snippets to
  the Revival Kit, export a Markdown cleanup report or the full JSON result.

## Privacy

Pasted and uploaded code never leaves your browser. The only network call is
the optional GitHub-URL fetch (unauthenticated GitHub API + raw file fetch).
No token is used or requested.

## Built with Kiro

The project was developed spec-first with Kiro:

- **Specs** — `.kiro/specs/seance/` (`requirements.md`, `design.md`, `tasks.md`).
- **Steering** — `.kiro/steering/` (product, tech, structure).
- **Hooks** — `.kiro/hooks/` (run tests on save; spec check before stopping).
- **Custom agents** — `.kiro/agents/` (`gravedigger` for deletion safety,
  `medium` for séance explanations).
- **MCP** — `.kiro/settings/mcp.json` (GitHub MCP configured but disabled in
  v1; the app uses the unauthenticated REST API instead).

See `KIROWEEN-PLAN.md` for the full build record, including the honest account
of which steps the Kiro agent executed and which steps still need the
Kiro-agent pass before submission.

## Tests

```bash
npm test   # plain node:test, no dependencies — 8 tests
```

## Similar tools (honest note)

Dead-code detection itself is not new: `knip`, `ts-prune`, and `vulture` do
parts of it well. Séance differs in the whole workflow: multi-language in one
client-side page, the graveyard UX, the bury/resurrect decision flow, and the
revival kit that preserves dead code instead of only deleting it.

## License

MIT. See `LICENSE`. Vendored dependency provenance in `LICENSES.md`
(Acorn 8.19.0, MIT).
