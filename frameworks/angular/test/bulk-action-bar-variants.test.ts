/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Injector, runInInjectionContext } from '@angular/core';
import { bulkActionBarStyles } from '../primitives/bulk-action-bar/bulk-action-bar.variants';
import { BulkActionBar } from '../primitives/bulk-action-bar/bulk-action-bar';

/* This suite asserts against the plain-TypeScript recipe and stays a
 * recipe suite, not a render suite (host-class-binding.test.ts owns the one
 * DOM render this primitive gets) -- but `output()` and `input()` both
 * throw NG0203 ("can only be used within an injection context") the moment
 * they are read outside one, which a bare `new BulkActionBar()` is. A
 * `runInInjectionContext` over an empty `Injector` supplies just enough
 * context to construct the real class and inspect its fields -- no
 * `TestBed`, no template compilation, no DOM. */
function constructBulkActionBar() {
  const injector = Injector.create({ providers: [] });
  return runInInjectionContext(injector, () => new BulkActionBar());
}

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default action is routine, not destructive', () => {
  assert.equal(bulkActionBarStyles().action(), bulkActionBarStyles({ destructive: false }).action());
});

test('destructive=true is outline in --error -- transparent at rest, border and text in --error, the soft tint only on hover, never a resting fill', () => {
  const action = tokens(bulkActionBarStyles({ destructive: true }).action());
  assert.ok(action.includes('border-error'), `expected border-error in "${action.join(' ')}"`);
  assert.ok(action.includes('text-error'), `expected text-error in "${action.join(' ')}"`);
  assert.ok(action.includes('hover:bg-error/14'), `expected hover:bg-error/14 in "${action.join(' ')}"`);
  assert.ok(action.includes('bg-transparent'), 'the resting background must stay transparent');
  assert.ok(!action.some((cls) => cls === 'bg-error' || cls.startsWith('bg-error-')), 'no resting fill in --error is allowed -- that surface belongs to ConfirmDialog alone');
});

test('destructive=false keeps the neutral border and text, with a neutral hover raise, never the danger family', () => {
  const action = tokens(bulkActionBarStyles({ destructive: false }).action());
  assert.ok(action.includes('border-base-300'));
  assert.ok(action.includes('text-base-content/82'));
  assert.ok(action.includes('hover:bg-base-200'));
  assert.ok(!action.some((cls) => cls.includes('error')), 'a routine action must carry no danger-family class');
});

test('open=false hides the root; open=true renders it as the flex bar', () => {
  const hidden = tokens(bulkActionBarStyles({ open: false }).root());
  assert.ok(hidden.includes('hidden'), `expected "hidden" in "${hidden.join(' ')}"`);
  assert.ok(!hidden.includes('flex'), 'the flex layout must not coexist with hidden');

  const visible = tokens(bulkActionBarStyles({ open: true }).root());
  assert.ok(visible.includes('flex'), `expected "flex" in "${visible.join(' ')}"`);
  assert.ok(!visible.includes('hidden'));
});

test('the hidden default matches the component\'s own default state -- count defaults to 0, so the bar starts hidden', () => {
  assert.equal(bulkActionBarStyles().root(), bulkActionBarStyles({ open: false }).root());
});

test('the root slot carries a display utility in its own base string, independent of the open variant', () => {
  // This is the property frameworks/angular/test/host-class-binding.test.ts
  // machine-checks against every primitive's manifest on disk; this asserts
  // the same thing against the recipe's own default output.
  assert.match(bulkActionBarStyles({ open: true }).root(), /\bflex\b/);
});

test('the count, number, divider and clear slots do not vary with destructive or open', () => {
  const a = bulkActionBarStyles({ destructive: true, open: true });
  const b = bulkActionBarStyles({ destructive: false, open: false });
  for (const slot of ['count', 'number', 'divider', 'clear'] as const) {
    assert.equal(a[slot](), b[slot](), `${slot} must not vary with destructive or open`);
  }
});

test('the divider uses the one-pixel utility, not a border-width token, since it is not a border', () => {
  assert.match(bulkActionBarStyles().divider(), /\bw-px\b/);
});

test('the Clear output was renamed from `cleared` to `clear`, per the API contract\'s event binding', () => {
  const instance = constructBulkActionBar();
  assert.equal(typeof instance.clear, 'object', '`clear` must exist and be an OutputEmitterRef');
  assert.equal('cleared' in instance, false, 'the pre-contract `cleared` name must be gone, not merely aliased');
});

test('classesFor still resolves a destructive action\'s classes to the same recipe output after the BulkAction retype', () => {
  const instance = constructBulkActionBar();
  const viaMethod = instance.classesFor({ label: 'Delete', destructive: true }).action();
  const viaRecipe = bulkActionBarStyles({ destructive: true }).action();
  assert.equal(viaMethod, viaRecipe);
});
