// tests/analyze.test.mjs — unit + property checks for the Séance analyser.
// Run with: npm test   (node --test tests/, no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from '../vendor/acorn.mjs';
import { analyzeFiles } from '../src/analyze.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'demo-repo', 'src');

function readFixture(name) {
  return { path: `src/${name}`, source: fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8') };
}

const DEMO = ['math.js', 'main.js', 'greet.js', 'unused.js', 'legacy.py'].map(readFixture);

// The frozen expected graveyard (fixtures/demo-repo/EXPECTED.md).
// Sorted by (file, line) — the order analyze.js emits.
const EXPECTED = [
  ['farewell', 'export', 'src/greet.js', 5],
  ['default', 'export', 'src/greet.js', 9],
  ['dead_function', 'function', 'src/legacy.py', 9],
  ['another_dead', 'function', 'src/legacy.py', 13],
  ['DeadClass', 'class', 'src/legacy.py', 17],
  ['unusedThing', 'import', 'src/math.js', 4],
  ['subtract', 'export', 'src/math.js', 10],
  ['(unreachable code)', 'unreachable', 'src/math.js', 21],
  ['secretHelper', 'function', 'src/math.js', 24],
  ['PI', 'export', 'src/math.js', 28],
];

test('demo fixture produces exactly the expected graveyard', () => {
  const result = analyzeFiles(DEMO, acorn);
  assert.equal(result.filesScanned, 5);
  assert.deepEqual(result.filesSkipped, []);
  const got = result.items.map((i) => [i.name, i.kind, i.file, i.line]);
  assert.deepEqual(got, EXPECTED);
  assert.ok(result.deadLines > 0);
});

test('deliberately alive symbols never appear as dead', () => {
  const result = analyzeFiles(DEMO, acorn);
  const names = new Set(result.items.map((i) => `${i.file}:${i.name}`));
  for (const alive of ['src/math.js:add', 'src/math.js:multiply', 'src/math.js:divide',
    'src/greet.js:greet', 'src/unused.js:unusedThing',
    'src/legacy.py:living_function', 'src/legacy.py:LivingClass',
    'src/legacy.py:os', 'src/legacy.py:json']) {
    assert.ok(!names.has(alive), `${alive} must stay alive`);
  }
});

test('every dead item carries a rule-based explanation with a safety rating', () => {
  const result = analyzeFiles(DEMO, acorn);
  for (const item of result.items) {
    assert.ok(item.explanation, `${item.name} needs an explanation`);
    assert.ok(['safe', 'caution', 'risky'].includes(item.explanation.safety), 'safety must be safe/caution/risky');
    assert.ok(item.explanation.text.includes('Rule-based explanation'), 'explanation must say it is rule-based');
    assert.ok(item.snippet.length > 0, 'snippet must be non-empty');
  }
  // Unused imports and unreachable code are Safe; exports are Caution.
  const byName = Object.fromEntries(result.items.map((i) => [i.name, i]));
  assert.equal(byName.unusedThing.explanation.safety, 'safe');
  assert.equal(byName['(unreachable code)'].explanation.safety, 'safe');
  assert.equal(byName.subtract.explanation.safety, 'caution');
});

test('clean repo yields zero dead items', () => {
  const clean = [
    { path: 'a.js', source: 'export function used() { return 1; }\n' },
    { path: 'b.js', source: "import { used } from './a.js';\nconsole.log(used());\n" },
  ];
  const result = analyzeFiles(clean, acorn);
  assert.deepEqual(result.items, []);
});

test('property: every reported-dead export has zero incoming imports (independent re-check)', () => {
  const result = analyzeFiles(DEMO, acorn);
  const allSources = DEMO.map((f) => f.source).join('\n');
  for (const item of result.items.filter((i) => i.kind === 'export' && i.name !== 'default')) {
    // Independent check: no `import ... <name> ... from` anywhere.
    const re = new RegExp(`import\\s*\\{[^}]*\\b${item.name}\\b[^}]*\\}`);
    assert.ok(!re.test(allSources), `${item.name} must have no incoming import`);
  }
});

test('property: analyser never throws on malformed input', () => {
  const corpusDir = path.join(__dirname, 'corpus');
  const malformed = fs.readdirSync(corpusDir).map((n) => ({
    path: n, source: fs.readFileSync(path.join(corpusDir, n), 'utf8'),
  }));
  malformed.push(
    { path: 'empty.js', source: '' },
    { path: 'only-comment.js', source: '// nothing here\n' },
    { path: 'unclosed.js', source: 'function broken( {\n  return 1;\n' },
    { path: 'binary.py', source: '\x00\x01\x02 def weird(:\n' },
  );
  for (const file of malformed) {
    assert.doesNotThrow(() => analyzeFiles([file], acorn), `must not throw on ${file.path}`);
  }
});

test('property: result is internally consistent', () => {
  const result = analyzeFiles(DEMO, acorn);
  const ids = new Set(result.items.map((i) => i.id));
  assert.equal(ids.size, result.items.length, 'ids must be unique');
  const scanned = new Set(DEMO.map((f) => f.path));
  for (const item of result.items) assert.ok(scanned.has(item.file), 'item file must be scanned');
  assert.ok(result.deadLines >= result.items.length, 'deadLines must cover every item');
});

test('python: a name used in another file keeps the definition alive', () => {
  const files = [
    { path: 'a.py', source: 'def helper():\n    return 1\n' },
    { path: 'b.py', source: 'from a import helper\nprint(helper())\n' },
  ];
  // Cross-file Python liveness is word-count based; helper appears in b.py.
  const result = analyzeFiles(files, acorn);
  assert.ok(!result.items.some((i) => i.name === 'helper'), 'helper is used in b.py and must stay alive');
});
