import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { bridgeProperties, referencedTokens, checkBridge, materialProperties } from './check-material.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';

const MATERIAL_PKG = join(repoRoot, 'node_modules', '@angular', 'material');

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

test('the oracle sees a property declared only in the prebuilt themes', () => {
  const props = materialProperties(MATERIAL_PKG);
  assert.ok(
    props.has('mdc-icon-button-state-layer-size'),
    '--mdc-icon-button-state-layer-size is declared only in prebuilt-themes/*.css',
  );
});

test('the oracle still sees a property declared only in the ES modules', () => {
  const props = materialProperties(MATERIAL_PKG);
  assert.ok(
    props.has('mat-focus-indicator-border-color'),
    '--mat-focus-indicator-border-color is declared only in fesm2022/*.mjs',
  );
});
