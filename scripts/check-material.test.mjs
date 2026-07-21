import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeProperties, referencedTokens, checkBridge } from './check-material.mjs';

const CSS = `
/* a comment naming --mdc-ignored-by-the-parser */
.mat-mdc-card {
  --mat-card-elevated-container-color: var(--surface-card);
  --mdc-elevated-card-container-shape: var(--r-lg);
  font-family: var(--font-mono);
}
`;

test('bridgeProperties collects only the Material custom properties a rule declares', () => {
  assert.deepEqual(
    [...bridgeProperties(CSS)].sort(),
    ['mat-card-elevated-container-color', 'mdc-elevated-card-container-shape'],
  );
});

test('referencedTokens collects the Arena tokens the bridge reads, including from plain properties', () => {
  assert.deepEqual(
    [...referencedTokens(CSS)].sort(),
    ['font-mono', 'r-lg', 'surface-card'],
  );
});

test('a property name no installed Material component reads is reported', () => {
  const errs = checkBridge(
    CSS,
    new Set(['mat-card-elevated-container-color']),
    new Set(['surface-card', 'r-lg', 'font-mono']),
  );
  assert.equal(errs.length, 1);
  assert.match(errs[0], /--mdc-elevated-card-container-shape/);
  assert.match(errs[0], /themes nothing/);
});

test('a var() naming no Arena token is reported', () => {
  const errs = checkBridge(
    CSS,
    new Set(['mat-card-elevated-container-color', 'mdc-elevated-card-container-shape']),
    new Set(['surface-card', 'font-mono']),
  );
  assert.equal(errs.length, 1);
  assert.match(errs[0], /var\(--r-lg\)/);
  assert.match(errs[0], /resolves to nothing/);
});

test('a bridge whose every name resolves reports nothing', () => {
  const errs = checkBridge(
    CSS,
    new Set(['mat-card-elevated-container-color', 'mdc-elevated-card-container-shape']),
    new Set(['surface-card', 'r-lg', 'font-mono']),
  );
  assert.deepEqual(errs, []);
});
