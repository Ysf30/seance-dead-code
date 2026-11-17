// analyze-py.js — HEURISTIC Python analysis (regex-based, not AST-exact).
// Labelled as heuristic in the UI. Pure functions, no DOM access.
// Reference counting is GLOBAL: analyze.js sums `nameCounts` across all
// Python files, so a name used in another file keeps a definition alive.

const WORD = /^[A-Za-z_][A-Za-z0-9_]*$/;

// Analyse one Python file. Returns a per-file record used by analyze.js.
export function analyzePyFile(path, source) {
  const lines = source.split('\n');
  const defs = [];    // {name, kind:'function'|'class', line, snippet}
  const importsList = []; // {local, line}
  const nameCounts = new Map();

  // Count every identifier-like word in the file (for cross-file liveness).
  for (const line of lines) {
    for (const w of line.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []) {
      nameCounts.set(w, (nameCounts.get(w) || 0) + 1);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/))) {
      defs.push({ name: m[1], kind: 'function', line: i + 1, snippet: lines.slice(i, Math.min(i + 3, lines.length)).join('\n').trim().slice(0, 400) });
    } else if ((m = line.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)\s*[(:]/))) {
      defs.push({ name: m[1], kind: 'class', line: i + 1, snippet: lines.slice(i, Math.min(i + 3, lines.length)).join('\n').trim().slice(0, 400) });
    } else if ((m = line.match(/^import\s+([A-Za-z_][A-Za-z0-9_]*)/))) {
      importsList.push({ local: m[1], line: i + 1 });
    } else if ((m = line.match(/^from\s+\S+\s+import\s+(.+)/))) {
      for (const part of m[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop().trim();
        if (WORD.test(name) && name !== '*') {
          importsList.push({ local: name, line: i + 1 });
        }
      }
    }
  }

  return { path, language: 'py', defs, imports: importsList, nameCounts, heuristic: true };
}
