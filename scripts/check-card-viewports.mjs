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
 * the second question's metric: the bottom-most child of body, plus body's
 * own bottom padding, which no child's rect includes. */
export const MEASURE_SCRIPT = `(async () => {
  const read = () => {
    const de = document.documentElement;
    const style = getComputedStyle(document.body);
    const bottoms = [...document.body.children].map((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const padding = parseFloat(style.paddingBottom) || 0;
    const root = document.querySelector('#root');
    return {
      scrollWidth: de.scrollWidth,
      scrollHeight: de.scrollHeight,
      clientWidth: de.clientWidth,
      clientHeight: de.clientHeight,
      contentHeight: Math.ceil(Math.max(0, ...bottoms, 0) + padding),
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
    await cdp.send('Page.navigate', { url }, sessionId);
    const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
      expression: MEASURE_SCRIPT,
      awaitPromise: true,
      returnByValue: true,
    }, sessionId);
    if (exceptionDetails) throw new Error(`${url}: ${exceptionDetails.text} ${exceptionDetails.exception?.description ?? ''}`);
    return result.value;
  } finally {
    await cdp.send('Target.closeTarget', { targetId });
  }
}
