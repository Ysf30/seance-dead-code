# Séance — Requirements

> Kiroween 2026 · Category: **Resurrection** · Spec: `seance`
> App: a client-side web app that finds dead code in a repository, shows it as a
> haunted graveyard, and lets the developer Bury it (delete safely) or Resurrect it
> (save it to a revival kit). Dead code is dead technology inside every living
> codebase — Séance brings it back into the light so it can be laid to rest or
> given a second life.

## Glossary

- **Dead item**: a code symbol (function, class, export, import) that has no
  references anywhere in the analysed file set.
- **Tombstone**: one dead item rendered as a grave marker in the UI.
- **Bury**: mark a dead item for deletion; it moves to the Burial List and is
  included in the exported cleanup report as a deletion candidate.
- **Resurrect**: save a dead item's code into the Revival Kit (a snippets library)
  with its explanation, so it can be reused later.
- **Séance explanation**: a rule-based explanation of what a dead item did, why it
  is dead, and how safe it is to delete. No LLM call is made in v1; the
  explanation is derived from the analysis data and is labelled as such.

## User stories

1. As a developer, I can point Séance at a public GitHub repo URL and get a
   graveyard of its dead code, so I can see what is rotting in my codebase.
2. As a developer, I can paste code directly or upload files and analyse them
   without any account, server, or install.
3. As a developer, I can click "Try the demo" and immediately see a full
   graveyard from a built-in sample repo, so I can judge the tool in one click.
4. As a developer, I can open any tombstone and read why that code is dead and
   how safe it is to bury, so I do not delete something load-bearing by mistake.
5. As a developer, I can Bury items and export a Markdown/JSON cleanup report,
   so the cleanup can be reviewed and applied in a pull request.
6. As a developer, I can Resurrect an item into the Revival Kit, so useful dead
   code is preserved as a reusable snippet instead of being lost.

## Requirements (EARS)

### REQ-1 — Repo input (GitHub URL)
- WHEN the user pastes a public GitHub repository URL and presses Analyse,
  THE SYSTEM SHALL fetch the repo file tree via the unauthenticated GitHub REST
  API and analyse all `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.py` files.
- WHEN the GitHub API rate limit (60 req/hour unauthenticated) is hit,
  THE SYSTEM SHALL show a clear error naming the rate limit and suggest
  pasting code or uploading files instead.
- WHEN the URL is not a valid GitHub repo URL, THE SYSTEM SHALL show a
  validation error and SHALL NOT start an analysis.

### REQ-2 — File upload and paste
- WHEN the user selects one or more code files, THE SYSTEM SHALL read them
  locally in the browser and analyse them. No file SHALL leave the user's
  machine except for the GitHub-URL flow in REQ-1.
- WHEN the user pastes code into the paste box and presses Analyse,
  THE SYSTEM SHALL analyse it as a single file named `pasted.<ext>` where
  `<ext>` is chosen by the user (js / py).

### REQ-3 — Demo fixture
- WHEN the user presses "Try the demo", THE SYSTEM SHALL analyse the built-in
  fixture repository (in `fixtures/demo-repo/`) and render its graveyard
  without any network request.

### REQ-4 — JavaScript/TypeScript analysis (AST-based)
- WHEN analysing JS/TS files, THE SYSTEM SHALL use the vendored Acorn parser
  to build an AST and SHALL report:
  - top-level functions (declarations and const arrow/function expressions)
    with zero references in the analysed file set;
  - named exports that are never imported by any file in the set;
  - imports whose binding is never used in the importing file;
  - statements unreachable after `return`, `throw`, `break`, or `continue`.
- WHEN a file fails to parse, THE SYSTEM SHALL skip that file, count it as
  skipped, and continue the analysis. It SHALL NOT crash the analysis.

### REQ-5 — Python analysis (heuristic)
- WHEN analysing Python files, THE SYSTEM SHALL report top-level `def` and
  `class` definitions whose name is never referenced elsewhere in the file
  set, and imports whose name is never used in the file.
- The Python analyser SHALL be labelled in the UI as heuristic (regex-based),
  not AST-exact.

### REQ-6 — Graveyard UI
- WHEN the analysis finishes, THE SYSTEM SHALL render:
  - a summary: files scanned, files skipped, dead items found, lines of dead code;
  - one tombstone per dead item showing name, file and line, kind, cause of
    death, and a code snippet.
- WHEN there are zero dead items, THE SYSTEM SHALL render an explicit
  "No ghosts here" empty state, not an empty page.

### REQ-7 — Tombstone detail and séance explanation
- WHEN the user opens a tombstone, THE SYSTEM SHALL show the full code
  snippet, the reference count (0), the cause, and a rule-based séance
  explanation stating what the code appears to do and a deletion-safety
  rating (Safe / Caution / Risky) with the reason.
- The safety rating SHALL be conservative: exported symbols are at most
  Caution (external consumers cannot be seen); unused imports and unreachable
  code are Safe.

### REQ-8 — Bury and Resurrect
- WHEN the user presses Bury on a tombstone, THE SYSTEM SHALL move it to the
  Burial List and mark the tombstone as buried.
- WHEN the user presses Resurrect on a tombstone, THE SYSTEM SHALL copy its
  code and explanation into the Revival Kit panel.
- Buried and resurrected items SHALL persist for the session only (in-memory);
  a page reload clears them.

### REQ-9 — Export
- WHEN the user presses Export, THE SYSTEM SHALL download a Markdown report
  (summary + buried items + revival kit) and offer a JSON download of the
  full analysis result.

### REQ-10 — Offline and privacy
- The app SHALL work fully offline after first load, except for the GitHub-URL
  flow (REQ-1) which needs network by definition.
- The app SHALL NOT send pasted or uploaded code to any server.

### REQ-11 — Design
- The UI SHALL be a coherent haunted-graveyard experience (dark, fog, moon,
  tombstones) built with CSS/SVG only — no external images or web fonts.
- The UI SHALL be usable on a desktop browser at 1280px and shall not depend
  on colour alone to convey state (icons + text labels).

## Non-goals (v1)
- No server, no accounts, no database, no LLM API calls.
- No .zip upload (multi-file upload covers it); no private-repo access.
- No automatic deletion of files in the user's repo (Bury only produces a
  report; applying it is the developer's job).
- No duplicate-code detection; no cross-language reference tracking.

## Acceptance criteria
- `npm test` (Node, no dependencies) passes: unit tests on fixtures plus
  property checks (every reported-dead export has zero incoming references in
  the fixture set; the analyser never throws on malformed input; counts are
  internally consistent).
- The demo fixture produces a known, stable graveyard (documented counts in
  `fixtures/demo-repo/EXPECTED.md`).
- The app loads from `index.html` with no build step and no network calls
  except the GitHub-URL flow.
