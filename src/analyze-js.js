// analyze-js.js — AST-based dead-code analysis for JavaScript / TypeScript.
// Pure functions: no DOM access, no network. `acorn` is injected so the same
// code runs in the browser (window.acorn) and in Node (require).
// NOTE: .ts/.tsx files are parsed with Acorn as JS; files with TS-only syntax
// fail to parse and are counted as skipped (honest limitation, see design.md).

// Generic recursive AST walker. Calls visit(node, parent) for every node.
function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof c.type === 'string') walk(c, visit, node);
    } else if (child && typeof child.type === 'string') {
      walk(child, visit, node);
    }
  }
}

function isDeclarationId(node, parent) {
  if (!parent) return false;
  if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') && parent.id === node) return true;
  if ((parent.type === 'VariableDeclarator') && parent.id === node) return true;
  if ((parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') && parent.id === node) return true;
  if ((parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier') && parent.local === node) return true;
  if ((parent.type === 'ExportSpecifier') && parent.local === node) return true; // local is a reference, not a declaration — handled below
  if ((parent.type === 'CatchClause') && parent.param === node) return true;
  return false;
}

// Analyse one JS file. Returns a per-file record used by analyze.js.
export function analyzeJsFile(path, source, acorn) {
  let ast;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      allowHashBang: true,
    });
  } catch (e) {
    return { path, language: 'js', skipped: `parse error: ${e.message.split('\n')[0]}` };
  }

  const defs = [];      // top-level functions / const-fns / classes
  const exportsList = []; // {name, local, line, start, end, isDefault}
  const importsList = []; // {local, imported, source, line, kind}
  const refs = [];      // {name, line, start, end}
  const unreachable = [];
  const lines = source.split('\n');

  const snippet = (node) => {
    const start = node.loc.start.line - 1;
    const end = Math.min(node.loc.end.line, start + 3);
    return lines.slice(start, end).join('\n').trim().slice(0, 400);
  };

  // Top-level declarations + imports/exports.
  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration' && node.id) {
      defs.push({ name: node.id.name, kind: 'function', line: node.loc.start.line, start: node.start, end: node.end, snippet: snippet(node), exported: false });
    } else if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations) {
        if (d.id && d.id.type === 'Identifier' && d.init && (d.init.type === 'FunctionExpression' || d.init.type === 'ArrowFunctionExpression')) {
          defs.push({ name: d.id.name, kind: 'function', line: d.loc.start.line, start: d.start, end: d.end, snippet: snippet(d), exported: false });
        }
      }
    } else if (node.type === 'ClassDeclaration' && node.id) {
      defs.push({ name: node.id.name, kind: 'class', line: node.loc.start.line, start: node.start, end: node.end, snippet: snippet(node), exported: false });
    } else if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        const d = node.declaration;
        if (d.type === 'FunctionDeclaration' && d.id) {
          defs.push({ name: d.id.name, kind: 'function', line: d.loc.start.line, start: d.start, end: d.end, snippet: snippet(d), exported: true });
          exportsList.push({ name: d.id.name, local: d.id.name, line: d.loc.start.line, start: d.start, end: d.end, isDefault: false });
        } else if (d.type === 'VariableDeclaration') {
          for (const v of d.declarations) {
            if (v.id && v.id.type === 'Identifier') {
              defs.push({ name: v.id.name, kind: 'variable', line: v.loc.start.line, start: v.start, end: v.end, snippet: snippet(v), exported: true });
              exportsList.push({ name: v.id.name, local: v.id.name, line: v.loc.start.line, start: v.start, end: v.end, isDefault: false });
            }
          }
        } else if (d.type === 'ClassDeclaration' && d.id) {
          defs.push({ name: d.id.name, kind: 'class', line: d.loc.start.line, start: d.start, end: d.end, snippet: snippet(d), exported: true });
          exportsList.push({ name: d.id.name, local: d.id.name, line: d.loc.start.line, start: d.start, end: d.end, isDefault: false });
        }
      }
      for (const s of node.specifiers || []) {
        if (s.type === 'ExportSpecifier') {
          exportsList.push({ name: s.exported.name, local: s.local.name, line: s.loc.start.line, start: s.start, end: s.end, isDefault: false, from: node.source ? node.source.value : null });
          if (!node.source) refs.push({ name: s.local.name, line: s.loc.start.line, start: s.start, end: s.end });
        }
      }
      if (node.source) {
        // export {a} from './x' — a reference into the source module.
        for (const s of node.specifiers || []) {
          if (s.type === 'ExportSpecifier') {
            refs.push({ name: s.local.name, line: s.loc.start.line, start: s.start, end: s.end, reexportFrom: node.source.value });
          }
        }
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      exportsList.push({ name: 'default', local: null, line: node.loc.start.line, start: node.start, end: node.end, isDefault: true });
      // NOTE: a default-exported named function is NOT also recorded as a def —
      // its liveness is covered by the 'default' export item (analyze.js),
      // so it is never double-reported.
    } else if (node.type === 'ExportAllDeclaration') {
      refs.push({ name: '*', line: node.loc.start.line, start: node.start, end: node.end, reexportFrom: node.source.value });
    } else if (node.type === 'ImportDeclaration') {
      for (const s of node.specifiers || []) {
        if (s.type === 'ImportSpecifier') {
          importsList.push({ local: s.local.name, imported: s.imported.name, source: node.source.value, line: s.loc.start.line, kind: 'named' });
        } else if (s.type === 'ImportDefaultSpecifier') {
          importsList.push({ local: s.local.name, imported: 'default', source: node.source.value, line: s.loc.start.line, kind: 'default' });
        } else if (s.type === 'ImportNamespaceSpecifier') {
          importsList.push({ local: s.local.name, imported: '*', source: node.source.value, line: s.loc.start.line, kind: 'namespace' });
        }
      }
    }
  }

  // All identifier references (excluding declaration sites and property keys).
  walk(ast, (node, parent) => {
    if (node.type !== 'Identifier') return;
    if (parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
    if (parent && parent.type === 'Property' && parent.key === node && !parent.computed) return;
    if (parent && parent.type === 'MethodDefinition' && parent.key === node && !parent.computed) return;
    if (parent && (parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier')) return;
    if (parent && parent.type === 'ExportSpecifier' && parent.exported === node) return;
    if (parent && parent.type === 'LabeledStatement' && parent.label === node) return;
    if (parent && parent.type === 'BreakStatement' && parent.label === node) return;
    if (parent && parent.type === 'ContinueStatement' && parent.label === node) return;
    if (isDeclarationId(node, parent) && !(parent.type === 'ExportSpecifier')) return;
    refs.push({ name: node.name, line: node.loc.start.line, start: node.start, end: node.end });
  });

  // Unreachable statements: anything after return/throw/break/continue in a block.
  const checkBlock = (body) => {
    let dead = false;
    for (const st of body) {
      if (dead) {
        unreachable.push({ line: st.loc.start.line, snippet: snippet(st) });
      } else if (st.type === 'ReturnStatement' || st.type === 'ThrowStatement' || st.type === 'BreakStatement' || st.type === 'ContinueStatement') {
        dead = true;
      }
    }
  };
  walk(ast, (node) => {
    if (node.type === 'BlockStatement') checkBlock(node.body);
    if (node.type === 'Program') checkBlock(node.body);
    if (node.type === 'SwitchCase') checkBlock(node.consequent);
  });

  return { path, language: 'js', defs, exports: exportsList, imports: importsList, refs, unreachable };
}

// Resolve a relative import specifier to a file path in the analysed set.
// Returns the matched path or null.
export function resolveImport(fromPath, spec, allPaths) {
  if (!spec.startsWith('.')) return null;
  const dir = fromPath.split('/').slice(0, -1).join('/');
  const base = (dir ? dir + '/' : '') + spec;
  const candidates = [
    base,
    base + '.js', base + '.jsx', base + '.ts', base + '.tsx', base + '.mjs',
    base + '/index.js', base + '/index.jsx', base + '/index.ts', base + '/index.tsx',
  ];
  for (const c of candidates) {
    const norm = c.split('/').filter((p) => p !== '.').join('/');
    if (allPaths.includes(norm)) return norm;
  }
  return null;
}
