import test from 'node:test';
import assert from 'node:assert/strict';
import { selectStyles } from './Select.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default is enabled, matching the component\'s own default input', () => {
  assert.equal(selectStyles().root(), selectStyles({ disabled: false }).root());
});

test('disabled=true dims the whole control from the root, not the field alone', () => {
  const root = tokens(selectStyles({ disabled: true }).root());
  assert.ok(root.includes('opacity-50'), `expected opacity-50 in "${root.join(' ')}"`);
  assert.ok(!tokens(selectStyles({ disabled: false }).root()).includes('opacity-50'));
});

test('only the root varies with disabled -- the field, label, wrap and caret are constant', () => {
  const enabled = selectStyles({ disabled: false });
  const off = selectStyles({ disabled: true });
  for (const slot of ['label', 'wrap', 'field', 'caret'] as const) {
    assert.equal(enabled[slot](), off[slot](), `${slot} must not vary with disabled`);
  }
});

test('the field strips the platform chrome and reserves room for the caret Arena draws instead', () => {
  const field = tokens(selectStyles().field());
  assert.ok(field.includes('appearance-none'), 'the native arrow must be suppressed');
  assert.ok(field.includes('pr-9'), 'the field must reserve the space the caret sits in');
});

test('the caret takes no pointer events, so clicking it opens the control beneath it', () => {
  assert.match(selectStyles().caret(), /\bpointer-events-none\b/);
});

test('the field carries its own focus ring rather than leaving the platform outline', () => {
  const field = selectStyles().field();
  assert.match(field, /\bfocus:border-secondary\b/);
  assert.match(field, /\bfocus:outline-none\b/);
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  assert.match(selectStyles().root(), /\bflex\b/);
});
