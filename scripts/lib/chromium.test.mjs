import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { CANDIDATES, findChromium, launchChromium } from './chromium.mjs';
import { createDispatcher } from './cdp.mjs';

/** The set of arena-chromium-* temp profile dirs mkdtempSync has left behind. */
function chromiumTempDirs() {
  return new Set(readdirSync(tmpdir()).filter((n) => n.startsWith('arena-chromium-')));
}

test('CHROME_PATH wins over the candidate list when it exists', () => {
  const found = findChromium({ CHROME_PATH: '/opt/my-chrome' }, (p) => p === '/opt/my-chrome');
  assert.deepEqual(found, { path: '/opt/my-chrome' });
});

test('CHROME_PATH pointing at nothing is an explicit reason, not a silent fallback', () => {
  const found = findChromium({ CHROME_PATH: '/opt/gone' }, () => false);
  assert.equal(found.path, null);
  assert.match(found.reason, /CHROME_PATH/);
  assert.match(found.reason, /\/opt\/gone/);
});

test('with no CHROME_PATH the first existing candidate wins, in list order', () => {
  const second = CANDIDATES[1];
  const found = findChromium({}, (p) => p === second);
  assert.deepEqual(found, { path: second });
});

test('no browser anywhere yields a reason naming what was looked for', () => {
  const found = findChromium({}, () => false);
  assert.equal(found.path, null);
  assert.match(found.reason, /no Chromium/i);
  assert.match(found.reason, /CHROME_PATH/);
});

test('the dispatcher numbers requests and resolves the matching reply', async () => {
  const d = createDispatcher();
  const a = d.next('Page.navigate', { url: 'x' });
  const b = d.next('Runtime.evaluate', { expression: '1' }, 'sess-1');

  assert.equal(a.frame.id, 1);
  assert.equal(b.frame.id, 2);
  assert.equal(b.frame.sessionId, 'sess-1');
  assert.equal(a.frame.sessionId, undefined);
  assert.equal(d.pending.size, 2);

  assert.equal(d.settle({ id: 2, result: { ok: true } }), true);
  assert.deepEqual(await b.result, { ok: true });
  assert.equal(d.pending.size, 1);
});

test('an error reply rejects with the protocol message', async () => {
  const d = createDispatcher();
  const a = d.next('Bad.method', {});
  d.settle({ id: 1, error: { code: -32601, message: 'Bad.method wasn\'t found' } });
  await assert.rejects(a.result, /Bad\.method wasn't found/);
});

test('an event (no id) is not a reply and settles nothing', () => {
  const d = createDispatcher();
  d.next('Page.enable', {});
  assert.equal(d.settle({ method: 'Page.loadEventFired', params: {} }), false);
  assert.equal(d.pending.size, 1);
});

test('drain rejects every pending request and clears the map', async () => {
  const d = createDispatcher();
  const a = d.next('Page.enable');
  const b = d.next('Runtime.enable');
  d.drain(new Error('CDP: connection closed'));
  await assert.rejects(a.result, /connection closed/);
  await assert.rejects(b.result, /connection closed/);
  assert.equal(d.pending.size, 0);
});

test('drain on an empty dispatcher is a no-op', () => {
  const d = createDispatcher();
  assert.doesNotThrow(() => d.drain(new Error('unused')));
  assert.equal(d.pending.size, 0);
});

test('a request made after drain still gets its own promise, unaffected by the earlier rejection', async () => {
  const d = createDispatcher();
  const a = d.next('Page.enable');
  d.drain(new Error('closed'));
  await assert.rejects(a.result);
  const b = d.next('Runtime.enable');
  assert.equal(d.settle({ id: b.frame.id, result: { ok: true } }), true);
  assert.deepEqual(await b.result, { ok: true });
});

test('launchChromium rejects instead of crashing when spawn cannot start the binary, and leaves no temp profile behind', async () => {
  const before = chromiumTempDirs();
  await assert.rejects(() => launchChromium('/this/path/does/not/exist'));
  const after = chromiumTempDirs();
  assert.deepEqual(after, before, 'a temp profile dir was left behind by the rejected launch');
});
