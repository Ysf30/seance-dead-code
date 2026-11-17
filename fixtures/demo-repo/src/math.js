// Demo fixture: a small math library with planted dead code.
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
