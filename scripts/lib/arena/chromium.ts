/* Finds and launches a headless browser for the three gates that need one. findChromium
 * answers the executable, or nothing and the reason, because each of those gates decides
 * for itself what the absence costs. CHROME_PATH is terminal rather than a preference:
 * set and pointing at nothing, it says so instead of falling back to the candidates. */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { arenaEnv } from './arena-scripts-vars.ts';

export const CANDIDATES = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

export type Chromium = { path: string; reason?: undefined } | { path: null; reason: string };

export function findChromium(env = arenaEnv(), exists = existsSync): Chromium {
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

export async function launchChromium(exePath: string): Promise<{ wsUrl: string; kill: () => void }> {
  const profile = mkdtempSync(join(tmpdir(), 'arena-chromium-'));

  const child = spawn(exePath, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'], detached: true });

  const kill = () => {
    if (typeof child.pid === 'number') {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {  }
    }
    try { rmSync(profile, { recursive: true, force: true }); } catch {  }
  };

  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chromium did not report a DevTools endpoint within 20s')), 20_000);
    let buffered = '';
    child.stderr.on('data', (chunk) => {
      buffered += String(chunk);
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buffered);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Chromium exited with code ${code} before listening`)); });

    child.on('error', (err) => { clearTimeout(timer); reject(err); });
  }).catch((err) => { kill(); throw err; });

  return { wsUrl: wsUrl as string, kill };
}
