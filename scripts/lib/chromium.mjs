/* Finding a Chromium binary, and launching it with a CDP port open.
 *
 * This is the one thing in the repo that is not runtime-portable, and the
 * gate that uses it says so out loud rather than pretending: with no browser
 * here, check-card-viewports.mjs skips with exit 2 and check-all reports the
 * run INCOMPLETE.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Looked at in this order when CHROME_PATH is unset. */
export const CANDIDATES = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

/** @param {Record<string, string|undefined>} env
 *  @param {(p: string) => boolean} exists injected for testing
 *  @returns {{path: string} | {path: null, reason: string}} */
export function findChromium(env = process.env, exists = existsSync) {
  const named = env.CHROME_PATH;
  if (named) {
    return exists(named)
      ? { path: named }
      : { path: null, reason: `CHROME_PATH is set to ${named}, but nothing is there` };
  }
  const found = CANDIDATES.find(exists);
  if (found) return { path: found };
  return {
    path: null,
    reason: `no Chromium found — looked at ${CANDIDATES.join(', ')}; set CHROME_PATH to point at one`,
  };
}

/** Launch headless with a debugging port, and wait for it to answer.
 *  @param {string} exePath @returns {Promise<{wsUrl: string, kill: () => void}>} */
export async function launchChromium(exePath) {
  const profile = mkdtempSync(join(tmpdir(), 'arena-chromium-'));
  const child = spawn(exePath, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const kill = () => {
    try { child.kill('SIGKILL'); } catch { /* already gone */ }
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
  };

  /* --remote-debugging-port=0 picks a free port and prints the ws URL on
     stderr as "DevTools listening on ws://...". Reading it is more reliable
     than polling a port we guessed, and it cannot collide with anything. */
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chromium did not report a DevTools endpoint within 20s')), 20_000);
    let buffered = '';
    child.stderr.on('data', (chunk) => {
      buffered += String(chunk);
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buffered);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Chromium exited with code ${code} before listening`)); });
    /* spawn() is async: a stale CHROME_PATH (ENOENT), a permission problem
       (EACCES), or the binary vanishing between findChromium's existsSync
       check and this spawn all surface as an 'error' event on the child,
       not as a thrown exception. An EventEmitter with no 'error' listener
       treats that event as fatal and rethrows it past any try/catch around
       launchChromium() — node crashes outright; Bun instead never fires
       'exit' either, so nothing here would ever settle and the promise
       would hang for the full 20s timer. Reject here instead, so a failed
       spawn becomes a rejection like every other failure mode above. */
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
  }).catch((err) => { kill(); throw err; });

  return { wsUrl, kill };
}
