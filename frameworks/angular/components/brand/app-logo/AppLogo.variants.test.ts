import test from 'node:test';
import assert from 'node:assert/strict';
import { appLogoStyles } from './AppLogo.variants';

test('size moves the mark box and the wordmark together -- they are one decision, not two independent knobs', () => {
  const sm = appLogoStyles({ size: 'sm' });
  const xl = appLogoStyles({ size: 'xl' });
  assert.notEqual(sm.mark(), xl.mark(), 'the mark box did not change between sm and xl');
  assert.notEqual(sm.name(), xl.name(), 'the wordmark size did not change between sm and xl');

  assert.equal(sm.root(), xl.root(), 'size must not change the root slot');
  assert.equal(sm.dim(), xl.dim(), 'size must not change the dim slot');
});

