// demo-data.js — the demo fixture embedded in the app so "Try the demo"
// works with no network request (including file://). Content mirrors
// fixtures/demo-repo/ exactly; tests/ asserts the analyser output matches
// fixtures/demo-repo/EXPECTED.md.
export const DEMO_FILES = [
  {
    path: 'src/math.js',
    source: `// Demo fixture: a small math library with planted dead code.
// Used by the "Try the demo" button and by tests/ (EXPECTED.md).

import { unusedThing } from './unused.js';

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  if (b === 0) return 0;
  return a / b;
  console.log('never reached');
}

function secretHelper(x) {
  return x * 2;
}

export const PI = 3.14159;
`,
  },
  {
    path: 'src/main.js',
    source: `import { add, multiply, divide } from './math.js';
import { greet } from './greet.js';

console.log(add(1, 2), multiply(3, 4), divide(10, 2), greet('world'));
`,
  },
  {
    path: 'src/greet.js',
    source: `export function greet(name) {
  return \`Hello, \${name}!\`;
}

export function farewell(name) {
  return \`Goodbye, \${name}.\`;
}

export default function defaultGreet() {
  return 'hi';
}
`,
  },
  {
    path: 'src/unused.js',
    source: `export function unusedThing() {
  return 'unused';
}
`,
  },
  {
    path: 'src/legacy.py',
    source: `import os
import json


def living_function():
    return os.getcwd()


def dead_function():
    return json.dumps({"a": 1})


def another_dead():
    return 42


class DeadClass:
    pass


class LivingClass:
    def method(self):
        return living_function()


instance = LivingClass()
`,
  },
];
