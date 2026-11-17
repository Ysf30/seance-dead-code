# Vendored dependency provenance

## Acorn 8.19.0 (MIT)

- Files: `vendor/acorn.js` (UMD build, loaded by the browser as a classic
  script) and `vendor/acorn.mjs` (ES module build, used by the Node tests).
- Source: `acorn@8.19.0` from npm (`npm pack acorn@8`, 17 Nov 2026).
- License: MIT (see the `LICENSE` file inside the npm package; the vendored
  files carry Acorn's own MIT header).
- Why two files: the repo's `package.json` declares `"type": "module"`, which
  makes Node load `vendor/acorn.js` as ESM — the UMD wrapper then exports
  nothing. The `.mjs` build is the correct ES-module form for Node; the `.js`
  UMD build is the correct classic-script form for the browser. Both are the
  same Acorn 8.19.0 release (verified identical parse behaviour in tests).
- Acorn parses code; it never executes it.
