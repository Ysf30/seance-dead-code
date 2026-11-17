// analyze.js — orchestrator. Dispatches files by language, runs the per-file
// analysers, resolves cross-file liveness, and produces the graveyard.
// Pure functions, no DOM access. `acorn` is injected (browser: window.acorn,
// Node: require('../vendor/acorn.js')).
import { analyzeJsFile, resolveImport } from './analyze-js.js';
import { analyzePyFile } from './analyze-py.js';
import { explain } from './explain.js';

const JS_EXT = new Set(['js', 'jsx', 'mjs', 'ts', 'tsx']);
const PY_EXT = new Set(['py']);

export function languageOf(path) {
  const ext = path.split('.').pop().toLowerCase();
  if (JS_EXT.has(ext)) return 'js';
  if (PY_EXT.has(ext)) return 'py';
  return null;
}

// files: [{path, source}] — acorn injected. Returns the analysis result.
export function analyzeFiles(files, acorn) {
  const perFile = [];
  const skipped = [];
  let idCounter = 0;
  const nextId = () => `tomb-${++idCounter}`;

  for (const f of files) {
    const lang = languageOf(f.path);
    if (!lang) continue;
    if (lang === 'js') {
      const r = analyzeJsFile(f.path, f.source, acorn);
      if (r.skipped) skipped.push({ path: f.path, reason: r.skipped });
      else perFile.push(r);
    } else {
      perFile.push(analyzePyFile(f.path, f.source));
    }
  }

  const allPaths = perFile.map((f) => f.path);
  const items = [];
  let deadLines = 0;

  // --- JS cross-file liveness ---
  for (const f of perFile.filter((x) => x.language === 'js')) {
    // Build the set of names referenced outside each def's own span.
    const refsByName = new Map();
    for (const pf of perFile.filter((x) => x.language === 'js')) {
      for (const r of pf.refs || []) {
        if (r.name === '*') continue;
        if (!refsByName.has(r.name)) refsByName.set(r.name, []);
        refsByName.get(r.name).push({ file: pf.path, start: r.start, end: r.end });
      }
    }
    // Imports of this file's exports from other files.
    const importedHere = new Map(); // export name -> true (imported by another file)
    for (const pf of perFile.filter((x) => x.language === 'js')) {
      if (pf.path === f.path) continue;
      for (const imp of pf.imports || []) {
        const target = resolveImport(pf.path, imp.source, allPaths);
        if (target === f.path) importedHere.set(imp.imported, true);
      }
    }

    for (const d of f.defs || []) {
      const outsideRefs = (refsByName.get(d.name) || []).filter(
        (r) => !(r.file === f.path && r.start >= d.start && r.end <= d.end)
      );
      const alive = outsideRefs.length > 0 || (d.exported && importedHere.get(d.name));
      if (!alive) {
        const item = {
          id: nextId(), name: d.name,
          kind: d.exported ? 'export' : d.kind === 'class' ? 'class' : d.kind === 'variable' ? 'variable' : 'function',
          file: f.path, line: d.line, snippet: d.snippet,
          cause: d.exported
            ? 'exported but never imported by any file in this set'
            : 'no references in the analysed file set',
          state: 'open',
        };
        item.explanation = explain(item);
        items.push(item);
        deadLines += item.snippet.split('\n').length;
      }
    }
    // Default export liveness.
    const defExp = (f.exports || []).find((e) => e.isDefault);
    if (defExp) {
      const defaultImported = perFile.some((pf) => pf.path !== f.path && (pf.imports || []).some(
        (imp) => imp.kind === 'default' && resolveImport(pf.path, imp.source, allPaths) === f.path
      ));
      if (!defaultImported && !items.some((i) => i.file === f.path && i.name === 'default')) {
        const item = {
          id: nextId(), name: 'default', kind: 'export', file: f.path, line: defExp.line,
          snippet: '(default export)', cause: 'default export never imported by any file in this set', state: 'open',
        };
        item.explanation = explain(item);
        items.push(item);
        deadLines += 1;
      }
    }
    // Unused imports.
    for (const imp of f.imports || []) {
      const used = (f.refs || []).some((r) => r.name === imp.local);
      if (!used) {
        const item = {
          id: nextId(), name: imp.local, kind: 'import', file: f.path, line: imp.line,
          snippet: `import … from '${imp.source}'`,
          cause: `imported from '${imp.source}' but never used in this file`, state: 'open',
        };
        item.explanation = explain(item);
        items.push(item);
        deadLines += 1;
      }
    }
    // Unreachable code.
    for (const u of f.unreachable || []) {
      const item = {
        id: nextId(), name: '(unreachable code)', kind: 'unreachable', file: f.path, line: u.line,
        snippet: u.snippet, cause: 'code after return / throw / break / continue can never execute', state: 'open',
      };
      item.explanation = explain(item);
      items.push(item);
      deadLines += u.snippet.split('\n').length;
    }
  }

  // --- Python cross-file liveness (heuristic) ---
  // Sum identifier counts across ALL Python files; a definition is dead
  // when its name appears exactly once in the whole set — its own
  // definition occurrence. (nameCounts counts every word occurrence.)
  const pyFiles = perFile.filter((x) => x.language === 'py');
  const pyGlobalCounts = new Map();
  for (const pf of pyFiles) {
    for (const [name, count] of pf.nameCounts || []) {
      pyGlobalCounts.set(name, (pyGlobalCounts.get(name) || 0) + count);
    }
  }
  for (const f of pyFiles) {
    for (const d of f.defs || []) {
      const total = pyGlobalCounts.get(d.name) || 0;
      if (total <= 1) {
        const item = {
          id: nextId(), name: d.name, kind: d.kind, file: f.path, line: d.line,
          snippet: d.snippet,
          cause: 'no references in the analysed file set (heuristic Python scan)',
          state: 'open', heuristic: true,
        };
        item.explanation = explain(item);
        items.push(item);
        deadLines += d.snippet.split('\n').length;
      }
    }
    for (const imp of f.imports || []) {
      // An import's own line contributes 1 occurrence; alive if > 1.
      const total = pyGlobalCounts.get(imp.local) || 0;
      if (total <= 1) {
        const item = {
          id: nextId(), name: imp.local, kind: 'import', file: f.path, line: imp.line,
          snippet: `import ${imp.local}`,
          cause: 'imported but never used in this file (heuristic Python scan)',
          state: 'open', heuristic: true,
        };
        item.explanation = explain(item);
        items.push(item);
        deadLines += 1;
      }
    }
  }

  items.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));

  return {
    filesScanned: perFile.length,
    filesSkipped: skipped,
    items,
    deadLines,
    scannedAt: new Date().toISOString(),
  };
}
