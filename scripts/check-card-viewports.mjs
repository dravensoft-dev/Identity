/* Every specimen and demo page opens with
 *
 *   <!-- @dsCard group="…" viewport="700x460" name="…" subtitle="…" -->
 *
 * and that viewport drives external card rendering. Until this gate, nothing
 * compared the number to the page: a page whose content outgrew its declared
 * height went on declaring the old one, and the rendered card silently lost
 * whatever fell past the fold. Nine of the 34 pages were doing exactly that.
 *
 * The check cannot be static. These pages transpile JSX in the browser and
 * fetch their own sources, so their height depends on fonts, on the token
 * layer, and on React actually running. A parser would report clean while
 * the tree was not — the very failure this gate exists to close. So it
 * measures a real render, which makes it the first gate needing a browser.
 *
 *   bun scripts/check-card-viewports.mjs   -> 0 every page fits
 *                                             1 at least one over-runs
 *                                             2 could not run here (no browser)
 *
 * Exit 2 is the loud skip: check-all.mjs maps it to SKIP and reports the whole
 * run INCOMPLETE, so a missing browser can never read as a green tree. With
 * ARENA_CHECK_STRICT=1 (or CI=true) the same condition exits 1 instead.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';
import { connect } from './lib/cdp.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Evaluated inside the page. Waits for fonts, then for jsx-loader's
 * arenaReady (absent on the 15 pages that use no JSX), then polls until the
 * measurement stops changing — arenaReady is a floor, not a finish line, and
 * React renders after the import resolves.
 *
 * scrollHeight never drops below clientHeight, so it answers "does the
 * content over-run" and cannot answer "does it under-run". contentHeight is
 * the second question's metric: the true content bottom, plus body's own
 * bottom padding, which no descendant's rect includes.
 *
 * "true content bottom" has to mean every descendant, not just body's direct
 * children: a position:relative wrapper holding a position:absolute overlay
 * (Arena's own dropdown shape — Menu.jsx, Select's open state) renders the
 * overlay well past the wrapper's own bottom, but an absolutely positioned
 * element contributes nothing to its ancestor's height, so the wrapper (and
 * whatever direct child of body contains it) reports short. Scanning
 * getElementsByTagName('*') catches that at any depth and for anything out
 * of normal flow, and is still one flat pass with no recursion, so it stays
 * cheap enough to run every 250ms in the stability loop below. */
export const MEASURE_SCRIPT = `(async () => {
  const read = () => {
    const de = document.documentElement;
    const style = getComputedStyle(document.body);
    const bottoms = [...document.body.getElementsByTagName('*')].map((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const padding = parseFloat(style.paddingBottom) || 0;
    const root = document.querySelector('#root');
    return {
      scrollWidth: de.scrollWidth,
      scrollHeight: de.scrollHeight,
      clientWidth: de.clientWidth,
      clientHeight: de.clientHeight,
      contentHeight: Math.ceil(Math.max(0, ...bottoms) + padding),
      rendered: !root || root.childElementCount > 0,
    };
  };

  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  if (window.arenaReady) await window.arenaReady();

  let previous = null;
  let stable = 0;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const now = read();
    const key = JSON.stringify(now);
    stable = key === previous ? stable + 1 : 0;
    previous = key;
    if (stable >= 2 && now.rendered) return { ...now, timedOut: false };
    await new Promise((r) => setTimeout(r, 250));
  }
  return { ...read(), timedOut: true };
})()`;

/* A page whose TCP connect never resolves (a stale IP, a dropped SYN, a CDN
 * having a bad day — every one of these 34 pages fetches React from esm.sh,
 * Babel from unpkg and Phosphor from jsdelivr, so this is a realistic
 * trigger) leaves the CDP command carrying it unsettled forever: neither
 * Page.navigate nor Runtime.evaluate reject on their own, confirmed by hand
 * against a listener that accepts the connection and then says nothing.
 * launchChromium spawns Chromium detached precisely so its zygote and
 * NetworkService children can be group-killed — which also means a Ctrl-C or
 * a CI timeout on *this* script never reaches that tree, since the signal
 * lands on the node/bun process, not the detached group: the browser and its
 * /tmp/arena-chromium-* profile are left for someone to clean up by hand.
 * Bounding these two awaits ourselves is what turns that into an ordinary
 * rejection that the caller's normal chrome.kill() cleans up like any other. */
const NAVIGATE_TIMEOUT_MS = 10_000;
/* MEASURE_SCRIPT carries its own 20s stability deadline and always resolves
 * by then, one way or another (timedOut: true if it never stabilizes). This
 * bound exists only for a request that never reaches the script at all — the
 * navigation stalled, the target died — so it has to clear 20s with real
 * margin, or a legitimately slow-but-working page would be cut off here
 * first instead of returning its own honest timedOut: true. */
const EVALUATE_TIMEOUT_MS = 30_000;

/** Race a promise against a timeout that rejects with a message naming what
 *  was waited on. Never leaves a dangling timer either way.
 *  @param {Promise<any>} promise @param {number} ms @param {string} message
 *  @returns {Promise<any>} */
function withTimeout(promise, ms, message) {
  let timer;
  const bound = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}

/** Load one page at a declared width and measure what it renders.
 *  Each page gets its own target, so no state leaks between pages.
 *  @param {{send: Function}} cdp
 *  @param {string} url
 *  @param {{width: number, height: number}} viewport
 *  @returns {Promise<{scrollWidth: number, scrollHeight: number, clientWidth: number,
 *                     clientHeight: number, contentHeight: number, rendered: boolean,
 *                     timedOut: boolean}>} */
export async function measurePage(cdp, url, viewport) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  try {
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
    }, sessionId);
    await withTimeout(
      cdp.send('Page.navigate', { url }, sessionId),
      NAVIGATE_TIMEOUT_MS,
      `${url}: Page.navigate did not settle within ${NAVIGATE_TIMEOUT_MS}ms`,
    );
    const { result, exceptionDetails } = await withTimeout(
      cdp.send('Runtime.evaluate', {
        expression: MEASURE_SCRIPT,
        awaitPromise: true,
        returnByValue: true,
      }, sessionId),
      EVALUATE_TIMEOUT_MS,
      `${url}: Runtime.evaluate did not settle within ${EVALUATE_TIMEOUT_MS}ms`,
    );
    if (exceptionDetails) throw new Error(`${url}: ${exceptionDetails.text} ${exceptionDetails.exception?.description ?? ''}`);
    return result.value;
  } finally {
    await cdp.send('Target.closeTarget', { targetId });
  }
}
