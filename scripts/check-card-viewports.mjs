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
 * of normal flow, and is still one flat pass with no recursion — measured by
 * hand at under 1ms against alert.card.html's real 26 elements and about
 * 100ms against a synthetic 20,000-element page, so it stays well inside the
 * 250ms cadence of the stability loop below for anything these pages render.
 *
 * The 20s deadline is computed *before* either await, not after — it is the
 * budget for the whole script, readiness included, not just the stability
 * loop that follows it. document.fonts.ready and arenaReady() are each as
 * unbounded as the CDP call this script runs inside of (arenaReady wraps a
 * live fetch from esm.sh, unpkg or jsdelivr, same as the page itself), so a
 * deadline that started only after them would make the script's real worst
 * case "however long readiness takes, plus 20s" — which can clear the outer
 * timeout measurePage wraps this call in, turning what should be an honest
 * { timedOut: true } into a bare rejection instead. Racing readiness against
 * the same deadline the stability loop uses is what keeps the two in one
 * bound: whatever readiness does, the script itself never runs past 20s. */
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

  const deadline = Date.now() + 20000;
  const readiness = (async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    if (window.arenaReady) await window.arenaReady();
  })();
  readiness.catch(() => {}); // seen as handled even if it loses the race below
  await Promise.race([readiness, new Promise((r) => setTimeout(r, Math.max(0, deadline - Date.now())))]);

  let previous = null;
  let stable = 0;
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
/* MEASURE_SCRIPT's own 20s deadline covers the whole script — readiness and
 * the stability loop both — and it always resolves by then, one way or
 * another (timedOut: true if it never stabilizes). This bound exists only
 * for a request that never reaches the script at all — the navigation
 * stalled, the target died — so it has to clear the script's 20s with real
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

/* Target.createTarget, Target.attachToTarget and Emulation.setDeviceMetricsOverride
 * touch no network and no page script — they are local bookkeeping the browser
 * process itself answers, so a hang here would mean a wedged or crashed
 * Chromium rather than a flaky CDN, a narrower failure than Page.navigate's.
 * Still the same shape of risk (an unsettled CDP send leaves the caller's
 * finally never reached), so they get the same NAVIGATE_TIMEOUT_MS bound for
 * a uniform reason: nothing measurePage awaits should be able to hang this
 * gate forever. Named generically (the method, not the page) since none of
 * these three carries a URL to name. */
function boundedSend(cdp, method, params, sessionId) {
  return withTimeout(
    cdp.send(method, params, sessionId),
    NAVIGATE_TIMEOUT_MS,
    `${method} did not settle within ${NAVIGATE_TIMEOUT_MS}ms`,
  );
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
  const { targetId } = await boundedSend(cdp, 'Target.createTarget', { url: 'about:blank' });
  try {
    const { sessionId } = await boundedSend(cdp, 'Target.attachToTarget', { targetId, flatten: true });
    await boundedSend(cdp, 'Emulation.setDeviceMetricsOverride', {
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
    // Bounded like the rest, but a timeout here is swallowed rather than
    // thrown: a throw from finally replaces whatever the try block was
    // returning or throwing, which would be strictly worse than a target
    // left open for chrome.kill() to reclaim along with the whole browser a
    // moment later in the caller — closeTarget failing is never the news.
    try {
      await boundedSend(cdp, 'Target.closeTarget', { targetId });
    } catch { /* best effort */ }
  }
}

/** How far a page may under-run its declared height before it is worth a word.
 *  A warning, never a failure: an over-tall card shows the whole specimen plus
 *  empty space, where a clipped one loses content silently. */
export const UNDER_RUN_SLACK = 120;

const SKIP_DIRS = new Set(['node_modules', '.git', '.claude-plugin', 'assets']);

/** @param {string} html @returns {{group: string, name: string, width: number, height: number} | null}
 *  The declaration, or null when the first line is not one. Only the first
 *  line counts: CLAUDE.md requires the comment to lead the file, and a stray
 *  @dsCard further down is not a declaration. */
export function parseDsCard(html) {
  const first = html.split('\n', 1)[0];
  if (!first.includes('@dsCard')) return null;
  const attr = (name) => new RegExp(`${name}="([^"]*)"`).exec(first)?.[1];
  const viewport = attr('viewport');
  const size = viewport && /^(\d+)x(\d+)$/.exec(viewport.trim());
  if (!size) return null;
  return { group: attr('group') ?? '', name: attr('name') ?? '', width: Number(size[1]), height: Number(size[2]) };
}

/** @param {string} root @returns {string[]} repo-relative paths of every .html
 *  file whose first line declares a @dsCard, sorted. */
export function findCardPages(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.html') && parseDsCard(readFileSync(path, 'utf8'))) {
        found.push(relative(root, path).split(sep).join('/'));
      }
    }
  };
  walk(root);
  return found.sort();
}

/** @param {{file: string, declared: {width: number, height: number}, measured: object}} input
 *  @returns {{file: string, status: 'ok'|'clip'|'under'|'unrendered', message: string}} */
export function classify({ file, declared, measured }) {
  if (!measured.rendered) {
    return {
      file,
      status: 'unrendered',
      message: `${file} did not render — #root is empty after 20s. The demo pages load React, Babel and Phosphor from CDNs; check network access.`,
    };
  }

  const width = Math.max(measured.scrollWidth, measured.clientWidth);
  const height = Math.max(measured.scrollHeight, measured.clientHeight);
  if (width > declared.width || height > declared.height) {
    const over = [
      width > declared.width ? `${width - declared.width}px wider` : null,
      height > declared.height ? `${height - declared.height}px taller` : null,
    ].filter(Boolean).join(' and ');
    return {
      file,
      status: 'clip',
      message: `${file} declares ${declared.width}x${declared.height} but renders ${width}x${height} — ${over}. The card is cropped to the declared box, so that content is lost. Declare ${width}x${height}.`,
    };
  }

  const short = declared.height - measured.contentHeight;
  if (short > UNDER_RUN_SLACK) {
    return {
      file,
      status: 'under',
      message: `${file} declares ${declared.width}x${declared.height} but its content ends ${short}px above the fold — the card renders mostly empty. Nothing is lost; consider ${declared.width}x${measured.contentHeight}.`,
    };
  }

  return { file, status: 'ok', message: '' };
}

/** @param {{file: string, status: string, message: string}[]} results
 *  @returns {{text: string, failed: number, warned: number, unrendered: number}} */
export function summarizeCards(results) {
  const of = (status) => results.filter((r) => r.status === status);
  const clips = of('clip');
  const unders = of('under');
  const unrendered = of('unrendered');

  const lines = [];
  if (clips.length) {
    lines.push(`check-card-viewports: ${clips.length} page(s) render past their declared box\n`);
    for (const r of clips) lines.push(`  ${r.message}`);
  }
  if (unrendered.length) {
    lines.push(`\ncheck-card-viewports: ${unrendered.length} page(s) could not be measured\n`);
    for (const r of unrendered) lines.push(`  ${r.message}`);
  }
  if (unders.length) {
    lines.push(`\ncheck-card-viewports: ${unders.length} warning(s) — over-tall declarations, nothing is lost\n`);
    for (const r of unders) lines.push(`  ${r.message}`);
  }
  if (!clips.length && !unrendered.length) {
    // A warning is not a failure, but the tail still has to agree with
    // whatever the warnings block above just printed — "every one fits"
    // right under a list of under-runs reads as the two halves of this
    // function disagreeing with each other.
    lines.push(unders.length
      ? `check-card-viewports: ${results.length} page(s) measured, none render past its declared box — ${unders.length} warning(s) above`
      : `check-card-viewports: ${results.length} page(s) measured, every one fits its declared viewport`);
  }

  return { text: lines.join('\n'), failed: clips.length, warned: unders.length, unrendered: unrendered.length };
}

/** Measure and classify one page, catching whatever measurePage rejects
 *  with — a navigate/evaluate timeout, a dropped CDN connection, a page-side
 *  exception surfaced through exceptionDetails, all realistic per the
 *  comments above measurePage — so a single flaky page cannot take the
 *  whole sweep down with it. Routed to 'unrendered': the file already
 *  treats "the browser ran but this page could not be measured" as a
 *  skip-class condition, never a pass, and the message names both the page
 *  and the underlying error rather than a bare "could not measure".
 *  @param {{send: Function}} cdp @param {string} file @param {string} pageRoot
 *  @param {number} port
 *  @returns {Promise<{file: string, status: string, message: string}>} */
export async function measureCardPage(cdp, file, pageRoot, port) {
  const declared = parseDsCard(readFileSync(join(pageRoot, file), 'utf8'));
  const url = `http://127.0.0.1:${port}/${file.split('/').map(encodeURIComponent).join('/')}`;
  try {
    const measured = await measurePage(cdp, url, { width: declared.width, height: declared.height });
    return classify({ file, declared, measured });
  } catch (err) {
    return {
      file,
      status: 'unrendered',
      message: `${file} could not be measured — ${err.message}`,
    };
  }
}

/** The exit code for "this gate cannot run here". 2 is the loud skip
 *  check-all maps to SKIP; strict mode turns it into a hard failure.
 *  @param {Record<string, string|undefined>} env @returns {1 | 2} */
export function skipExitCode(env = process.env) {
  return env.ARENA_CHECK_STRICT === '1' || env.CI === 'true' ? 1 : 2;
}

function skip(reason) {
  const code = skipExitCode(process.env);
  console.error(`check-card-viewports: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; set ARENA_CHECK_STRICT=1 to make this a failure.');
  process.exit(code);
}

async function main() {
  const browser = findChromium(process.env);
  if (!browser.path) skip(browser.reason);

  const pages = findCardPages(root);
  const server = await startStaticServer(root);
  let chrome;
  let cdp;
  try {
    chrome = await launchChromium(browser.path);
    cdp = await connect(chrome.wsUrl);
  } catch (err) {
    await server.close();
    chrome?.kill();
    skip(`${browser.path} could not be driven: ${err.message}`);
  }

  const results = [];
  try {
    for (const file of pages) {
      results.push(await measureCardPage(cdp, file, root, server.port));
    }
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }

  const summary = summarizeCards(results);
  // A run can carry both a clip and an unrendered page at once. This branch
  // checks failed first, so that combination exits 1, not 2 — a known
  // over-run is more actionable than a page nothing could measure, and
  // both are printed either way, so the choice only affects the exit code.
  if (summary.failed) {
    console.error(summary.text);
    process.exit(1);
  }
  console.log(summary.text);
  if (summary.unrendered) skip(`${summary.unrendered} page(s) never rendered — see above`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
