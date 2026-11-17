# Steering — Tech

## Stack

- **Static site, zero build step.** `index.html` + `styles.css` + ES modules
  under `src/`. No framework, no bundler, no backend, no dependencies at
  runtime except the vendored Acorn parser.
- **Language:** vanilla JavaScript (ES2022), HTML, CSS. Node 18+ for tests.
- **Parser:** Acorn 8.x (MIT), vendored in `vendor/acorn.js`. It parses; it
  never executes user code.
- **Tests:** plain `node:test`, no test framework, no dependencies.
- **Hosting:** GitHub Pages from the repo root.

## Conventions

- ES modules everywhere (`import`/`export`). No globals except the Acorn
  namespace import.
- Never use `eval` or `new Function` on user code. Never render user code
  with `innerHTML` — use `textContent` and DOM APIs only.
- Every analyser function is pure: input files in, result object out. No DOM
  access inside `src/analyze*.js` or `src/explain.js` (keeps them testable in Node).
- All user-facing strings in English (Kiroween language requirement).
- Errors are shown to the user in plain language with the next step
  ("GitHub rate limit hit — paste code or upload files instead"), never a
  raw stack trace.
- Files under `fixtures/` are test data, never shipped as app logic.
- `/.kiro` is always committed. Never add it to `.gitignore`.
