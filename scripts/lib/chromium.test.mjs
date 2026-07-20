import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { CANDIDATES, findChromium, launchChromium } from './chromium.mjs';
import { createDispatcher } from './cdp.mjs';

/** The set of arena-chromium-* temp profile dirs mkdtempSync has left behind. */
function chromiumTempDirs() {
  return new Set(readdirSync(tmpdir()).filter((n) => n.startsWith('arena-chromium-')));
}

/** pids of every process (the launched one and any descendant) whose command
 *  line still names this profile dir — empty once nothing is left of it.
 *  execFileSync runs pgrep directly, with no wrapping shell: pgrep already
 *  excludes its own pid from a -f match, but a `sh -c "pgrep -f ...pattern"`
 *  would still match the wrapping shell itself, since that shell's own
 *  command line contains the very pattern being searched for. */
function processesNaming(profilePath) {
  try {
    return execFileSync('pgrep', ['-f', `user-data-dir=${profilePath}`], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim().split('\n').filter(Boolean);
  } catch {
    return []; // pgrep exits 1 when nothing matches
  }
}

/** Poll `predicate` until it is true or `timeoutMs` elapses, rather than
 *  sleeping a fixed guess — cleanup here is asynchronous (a killed process
 *  group takes the kernel a moment to actually reap), and a fixed sleep
 *  would either flake under load or hide a real regression by being long
 *  enough to always pass. @returns {Promise<boolean>} */
async function waitUntil(predicate, { timeoutMs = 5000, intervalMs = 100 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (predicate()) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
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

test('kill() reaps the whole process group: no descendant survives it and no temp profile outlives it', async (t) => {
  const found = findChromium();
  if (!found.path) { t.skip(`no Chromium available to test against: ${found.reason}`); return; }

  const before = chromiumTempDirs();
  const { kill } = await launchChromium(found.path);
  const created = [...chromiumTempDirs()].filter((d) => !before.has(d));
  assert.equal(created.length, 1, 'launchChromium should have made exactly one new temp profile dir');
  const profilePath = join(tmpdir(), created[0]);

  /* Confirm this browser really did fork descendants sharing the profile
     dir before asserting kill() reaps them — otherwise the assertion below
     would pass vacuously on a build that forks nothing. */
  const beforeKill = processesNaming(profilePath);
  assert.ok(beforeKill.length > 1,
    `expected Chromium to have forked at least one subprocess sharing ${profilePath}, found ${beforeKill.length}`);

  kill();

  const settled = await waitUntil(() => !existsSync(profilePath) && processesNaming(profilePath).length === 0);
  assert.ok(settled,
    `outlived kill(): dir exists=${existsSync(profilePath)}, processes=${JSON.stringify(processesNaming(profilePath))}`);
});
