import test from 'node:test';
import assert from 'node:assert/strict';
import { referencedTokens, arenaTokenNames } from './arena-tokens.ts';
import { repoRoot } from '../arena/repo-root.mjs';

test('referencedTokens collects the Arena tokens a stylesheet reads, from any property', () => {
  const css = '.x { --mat-thing: var(--crimson); color: var( --bone , red); background: #fff }';
  assert.deepEqual([...referencedTokens(css)].sort(), ['bone', 'crimson']);
});

test('referencedTokens ignores a token named only inside a comment', () => {
  assert.deepEqual([...referencedTokens('/* var(--ghost) */ .x { color: var(--bone) }')], ['bone']);
});

test('arenaTokenNames sees both the generated tokens and the hand-authored aliases in colors.css', () => {
  const names = arenaTokenNames(repoRoot);
  assert.ok(names.size > 0, 'a reader that finds no token at all would pass every bridge by construction');
  assert.ok(names.has('crimson'), 'colors.css declares the legacy aliases and they must be readable');
  assert.ok(names.has('z-toast'), 'the generated layer must be in scope too');
});
