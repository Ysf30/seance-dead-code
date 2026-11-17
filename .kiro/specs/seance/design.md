# Séance — Design

## Overview

Séance is a zero-build, fully client-side single-page app. One HTML file, one
CSS file, one JS application file, and one vendored parser (`vendor/acorn.js`,
MIT). It is served as a static site (GitHub Pages) and works offline after
first load, except for the optional GitHub-URL fetch.

## Architecture

```
index.html            — shell: header, input panel, graveyard, burial list, revival kit
styles.css            — graveyard theme (CSS/SVG only, no external assets)
app.js                — UI wiring, state, rendering
  ├─ src/github.js    — GitHub REST fetch (tree + file contents, unauthenticated)
  ├─ src/analyze.js   — language dispatch + result model
  ├─ src/analyze-js.js— Acorn AST analysis (functions, exports, imports, unreachable)
  ├─ src/analyze-py.js— heuristic Python analysis (regex-based, labelled as such)
  ├─ src/explain.js   — rule-based séance explanations + safety ratings
  └─ src/export.js    — Markdown + JSON report download
vendor/acorn.js       — Acorn parser (MIT), vendored; LICENSES.md records provenance
fixtures/demo-repo/   — sample repo with planted dead code + EXPECTED.md
tests/                — node:test unit + property checks, no dependencies
```

All `src/*.js` files are loaded as ES modules from `app.js` via `<script type="module">`.
No bundler, no framework. This keeps the app auditable, fast to load, and
trivially hostable.

## Data model

```js
// One analysed file
{ path: string, language: 'js' | 'py', source: string, skipped?: string }

// One dead item (a tombstone)
{
  id: string,            // stable: path + name + line
  name: string,
  kind: 'function' | 'class' | 'export' | 'import' | 'unreachable',
  file: string, line: number, snippet: string,
  cause: string,         // e.g. "no references in 12 files"
  safety: 'safe' | 'caution' | 'risky',
  explanation: string,   // rule-based séance text
  state: 'open' | 'buried' | 'resurrected'
}

// Analysis result
{ files: File[], skipped: {path, reason}[], items: DeadItem[], scannedAt: ISO string }
```

## Analysis design

### JS/TS (Acorn AST)
1. Parse each file with Acorn (ECMAScript latest, `sourceType: 'module'`,
   `locations: true`). Parse failure → file counted as skipped, analysis
   continues.
2. Walk the AST per file and collect: top-level function declarations,
   top-level `const`/`let` holding a function/arrow, named export declarations
   and their local names, import declarations and their bindings, all
   identifier references (excluding declaration sites and property keys).
3. Cross-file: an export is alive if any other file imports its name; a
   top-level function is alive if its name is referenced in any file
   (including its own, outside its own body).
4. Unreachable: statements following `return`/`throw`/`break`/`continue`
   within the same block, reported with the statement's source text.
5. TypeScript syntax is NOT parsed by Acorn in v1: `.ts`/`.tsx` files are
   parsed with Acorn after stripping type annotations is out of scope —
   instead, `.ts`/`.tsx` files are analysed with the same AST pass and any
   file that fails to parse is counted as skipped (honest limitation, shown
   in the UI). A future version can vendor a TS parser.

### Python (heuristic)
1. Regex pass per file: `^def NAME(`, `^class NAME`, `^import X` /
   `^from M import NAME`.
2. A definition is dead if its name never appears as a word elsewhere in the
   file set (excluding its own definition line).
3. Labelled "heuristic" in the UI. Known limitation: dynamic references
   (`getattr`, `eval`, string-based dispatch) are invisible to it — the
   explanation says so and caps safety at Caution for defs/classes.

## Explanation rules (explain.js)
- Unused import → Safe. "Imported but never used. Deleting the import line
  cannot change behaviour."
- Unreachable code → Safe. "Code after return/throw can never execute."
- Top-level function, no references → Caution. "Nothing in this file set
  calls it. It may still be called from outside the analysed set."
- Named export, never imported → Caution. "No file in this set imports it.
  External consumers (published packages, other repos) cannot be seen."
- Python def/class → Caution, plus the dynamic-reference caveat.
- Every explanation states it is rule-based, not an LLM judgement.

## UI design (graveyard)
- Palette: near-black night sky `#0b0e1a`, grave green `#7ee787`-ish muted to
  `#8fce9b`, moonlight `#e8e6d5`, accent purple `#b79cff`, danger ember `#ff7a59`.
- Background: layered CSS gradients (fog bands) + a CSS moon (radial gradient
  circle) + twinkling stars (box-shadow dots). No images.
- Tombstones: rounded-top rectangles with an engraved name, subtle
  box-shadow, hover lift; buried tombstones sink (translateY + desaturate).
- Candle flicker: CSS keyframes on a small flame element in the header.
- State is never colour-only: each tombstone carries a text badge
  (OPEN / BURIED / RESURRECTED) and an icon.
- Layout: header (title + moon), input panel (URL / upload / paste / demo),
  stats bar, graveyard grid, detail drawer, burial list, revival kit,
  footer with honest scope note.

## Testing strategy
- `tests/` run with plain `node:test`, no dependencies.
- Unit tests: analyser on each fixture file; expected dead items asserted
  exactly (names + kinds).
- Property checks (seeded, deterministic): (1) every reported-dead export
  has zero incoming references in the fixture set; (2) the analyser never
  throws on malformed/truncated input (fuzz corpus in `tests/corpus/`);
  (3) `items.length + aliveCount` accounting is consistent per file;
  (4) export of a known-clean repo yields zero items.
- The demo fixture has a frozen expected count in
  `fixtures/demo-repo/EXPECTED.md`; the test asserts the analyser reproduces it.

## Security and privacy
- Pasted/uploaded code never leaves the browser (no fetch except GitHub API
  for the URL flow).
- GitHub fetch uses unauthenticated REST; no token is stored or requested.
- No `eval` on user code. Acorn parses, never executes. Snippets are rendered
  with `textContent`, never `innerHTML`, so code cannot inject markup.

## Deployment
- Static hosting (GitHub Pages, root). No server, no env vars, no secrets.
- The repo must keep `/.kiro` committed (never in `.gitignore`) per the
  Kiroween rules.
