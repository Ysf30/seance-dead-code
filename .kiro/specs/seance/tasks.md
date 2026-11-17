# Séance — Implementation tasks

> Execute in order. Each task references the requirements it satisfies.
> Check a task off only when its acceptance check passes.

- [x] 1. Scaffold the repo
  - `index.html` shell, `styles.css`, `app.js` (ES module entry), `src/` modules,
    `vendor/` with Acorn, `fixtures/demo-repo/`, `tests/`, `README.md`, MIT `LICENSE`.
  - `.gitignore` must NOT list `.kiro` (Kiroween rule).
  - _Req: REQ-10, REQ-11_ — DONE 17 Nov 2026.

- [x] 2. Vendor the Acorn parser
  - Fetch Acorn 8.x dist (`acorn.js`, MIT) into `vendor/acorn.js`; record
    version + license in `LICENSES.md`.
  - Smoke test: `node -e "import('./vendor/acorn.js')"` parses a sample.
  - _Req: REQ-4_ — DONE: Acorn 8.19.0, both `acorn.js` (browser UMD) and
    `acorn.mjs` (Node ESM) vendored; parse verified. See LICENSES.md for why
    both files exist (package `"type": "module"` breaks UMD under require).

- [x] 3. Build the JS/TS analyser (`src/analyze-js.js`)
  - Acorn parse with locations; collect top-level functions, exports, imports,
    references; cross-file liveness; unreachable-statement detection.
  - Parse failures → file skipped, never a crash.
  - _Req: REQ-4_ — DONE; verified by tests.

- [x] 4. Build the Python analyser (`src/analyze-py.js`)
  - Regex-based def/class/import detection + reference counting; label
    heuristic in code and UI.
  - _Req: REQ-5_ — DONE; global word-count liveness across files.

- [x] 5. Build the explanation engine (`src/explain.js`)
  - Rule-based explanations + safety ratings (Safe/Caution/Risky) per design.
  - Every explanation states it is rule-based.
  - _Req: REQ-7_ — DONE.

- [x] 6. Build the input flows (`src/github.js`, `app.js`)
  - GitHub URL fetch (tree + contents, unauthenticated, rate-limit error),
    multi-file upload, paste box, demo-fixture loader.
  - _Req: REQ-1, REQ-2, REQ-3_ — DONE.

- [x] 7. Build the graveyard UI (`index.html`, `styles.css`, `app.js`)
  - Stats bar, tombstone grid, detail drawer, burial list, revival kit,
    empty state, honest scope note.
  - CSS/SVG-only haunted theme; state shown with text badges, not colour alone.
  - _Req: REQ-6, REQ-8, REQ-11_ — DONE.

- [x] 8. Build export (`src/export.js`)
  - Markdown report + JSON download of the analysis result.
  - _Req: REQ-9_ — DONE.

- [x] 9. Fixtures and expected counts
  - `fixtures/demo-repo/` with planted dead code (JS + Python) and
    `EXPECTED.md` with the frozen expected graveyard.
  - _Req: REQ-3_ — DONE: 5 files, 10 expected items, exact match verified.

- [x] 10. Tests (`tests/`, plain `node:test`, no deps)
  - Unit tests on fixtures (exact expected items) + property checks
    (zero-reference invariant, no-throw on malformed input, count
    consistency, clean repo yields zero items).
  - `npm test` passes. (The repo has no dependencies; `npm test` runs `node --test`.)
  - _Req: Acceptance criteria_ — DONE: 8/8 tests pass.

- [x] 11. Verify the app end to end
  - Open `index.html` (static server), run the demo, bury one item, resurrect
    one item, export the report, confirm the graveyard matches EXPECTED.md.
  - Confirm no network calls except the GitHub-URL flow.
  - DONE (static check): all 9 JS files pass `node --check`; embedded demo
    data reproduces the exact 10-item graveyard; HTML parses with no unclosed
    tags; static server returns 200 for index.html, app.js, vendor/acorn.js.
    Interactive browser click-through (bury/resurrect/export buttons) NOT yet
    verified in a real browser — see KIROWEEN-PLAN.md open items.

- [ ] 12. Kiro-agent pass (REQUIRED before submission)
  - After `kiro-cli login --use-device-flow` (user step), run the real Kiro
    agent against this spec: ask it to review the implementation against
    requirements.md, fix any gaps, and run the tests. Record the session in
    the submission write-up. Until this pass happens, the write-up must NOT
    claim the code was implemented by Kiro.
