/* readJson names the file it could not parse, which JSON.parse never does: a gate reading
 * forty-three manifests in a loop and dying with "Unexpected token" names none of them, and
 * the loop is where that costs the most. readIfExists answers null for a document that is not
 * there and throws for one it cannot read, so an absent file and an unreadable one stay two
 * different answers rather than one. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readJson, readIfExists } from './read-file.ts';

const dir = () => mkdtempSync(join(tmpdir(), 'arena-read-'));

test('a document comes back parsed, and a caller that states a shape needs no cast', () => {
  const root = dir();
  try {
    const path = join(root, 'a.json');
    writeFileSync(path, '{"name":"ArenaButton","api":{}}');
    const contract: { name: string } = readJson(path);
    assert.equal(contract.name, 'ArenaButton');
  } finally { rmSync(root, { recursive: true }); }
});

test('a malformed document throws with its own path in the message', () => {
  const root = dir();
  try {
    const path = join(root, 'broken.json');
    writeFileSync(path, '{"a":1,}');
    assert.throws(() => readJson(path), (err: Error) => err.message.includes(path),
      'the parse error alone names no file, and a loop over forty-three of them then names none');
  } finally { rmSync(root, { recursive: true }); }
});

test('a document that is not there throws ENOENT, which already names it', () => {
  assert.throws(() => readJson(join(tmpdir(), 'arena-read-nowhere.json')), /ENOENT/);
});

test('readIfExists answers null for what is not there and the text for what is', () => {
  const root = dir();
  try {
    const path = join(root, 'page.html');
    writeFileSync(path, '<main></main>');
    assert.equal(readIfExists(path), '<main></main>');
    assert.equal(readIfExists(join(root, 'gone.html')), null);
  } finally { rmSync(root, { recursive: true }); }
});
