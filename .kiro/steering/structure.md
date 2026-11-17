# Steering — Structure

```
kiroween-seance/            (repo root; GitHub Pages serves index.html)
├── index.html              — app shell
├── styles.css              — graveyard theme
├── app.js                  — UI wiring + state + rendering
├── src/
│   ├── github.js           — GitHub REST fetch (URL flow only)
│   ├── analyze.js          — language dispatch + result model
│   ├── analyze-js.js       — Acorn AST analysis (JS/TS)
│   ├── analyze-py.js       — heuristic Python analysis
│   ├── explain.js          — rule-based séance explanations + safety
│   └── export.js           — Markdown + JSON report download
├── vendor/
│   └── acorn.js            — Acorn parser (MIT, vendored)
├── fixtures/
│   └── demo-repo/          — sample repo + EXPECTED.md
├── tests/                  — node:test unit + property checks
├── .kiro/
│   ├── specs/seance/       — requirements.md, design.md, tasks.md
│   ├── steering/           — product.md, tech.md, structure.md
│   ├── hooks/              — automation hooks (JSON)
│   ├── agents/             — custom agents (Markdown)
│   └── settings/mcp.json   — MCP server config
├── README.md
├── LICENSE                 — MIT
├── LICENSES.md             — vendored-dependency provenance
├── KIROWEEN-PLAN.md        — build record (this task's log)
└── .gitignore              — must NOT contain .kiro
```
