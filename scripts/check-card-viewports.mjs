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
 * A page carrying an infinitely-animating component (Spinner, ProgressBar,
 * Skeleton — anything in the repo using `infinite`) is measured at its
 * resting frame, not at whatever instant the stability loop happens to land
 * on: every animation is frozen (see freezeAnimations) before MEASURE_SCRIPT
 * runs. Without that, a rotating element's bounding box never repeats across
 * two reads, the stability loop never sees two identical reads, and it burns
 * its full 20s deadline on every run — measuring something different, and
 * arbitrary, each time. A page that still never stabilizes after the freeze
 * is not classified as if it had — see classify's timedOut branch.
 *
 * Pages are measured PAGE_CONCURRENCY at a time. Each already gets its own
 * isolated CDP target (measurePage's own doc), so they are independent by
 * construction, but the dispatch order is interleaved rather than the plain
 * sorted one (see interleaveForDispatch) so pages that sort next to each
 * other never share a concurrent wave, and the results are always restored
 * to sorted-by-filename order before printing, regardless of which target
 * answers first — the output is compared by humans across runs.
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
 * React renders after the import resolves. document.fonts.ready is a floor
 * for the same reason, and the stability loop re-checks it below (see
 * fontsSettled): it resolves once every font face the document has *asked
 * for so far* is loaded, but content that mounts after — an icon glyph, a
 * monospace label — can ask for a face nothing had requested yet, and
 * document.fonts does not re-open the promise that already resolved. Found
 * by hand chasing exactly this: two pages (forms.card.html,
 * ConfirmDialog.card.html) measured a taller box than they render at rest,
 * for as long as ~200ms after document.fonts.ready — a fallback glyph's
 * metrics before the real font swaps in — every time, reproducibly. The old
 * 150ms/3-reads floor almost always outlasted that swap by accident; nothing
 * about it was ever waiting for fonts on purpose.
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
 * 100ms against a synthetic 20,000-element page, so it stays comfortably
 * inside a single frame's budget (~16ms at 60Hz) — the cadence the stability
 * loop below now polls at — for anything these pages render.
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
/* How the stability loop below waits between reads. A fixed setTimeout used
 * to sit here — 150ms, tuned only to clear a mutation tick in this file's own
 * test fixture, never because a page needed that long to settle — and every
 * page paid it whether or not its layout had already finished changing: two
 * sleeps at that cadence, since the loop wants three identical reads in a
 * row, meant a 300ms floor per page regardless of how fast it actually
 * settled. freezeAnimations (below) already removes the one real source of
 * continuous change these pages have, so once layout stops changing it stays
 * stopped — there is nothing to gain by re-checking it every 150ms instead of
 * every time the browser might actually have painted something new, which is
 * a real frame, not an invented interval.
 *
 * nextFrame() (inside MEASURE_SCRIPT) waits for exactly that: one
 * requestAnimationFrame callback, so a page that is already settled confirms
 * it across a handful of real ~16ms frames instead of invented 150ms sleeps.
 * FRAME_FALLBACK_MS backs it with a plain timer for the one case rAF cannot
 * cover on its own: a backgrounded or throttled tab can starve
 * requestAnimationFrame outright, and without a fallback the loop would wait
 * on a callback that may never come instead of advancing toward the 20s
 * deadline. These pages run in a headless target that should stay
 * foregrounded, so in practice the timer never wins the race against a real
 * frame — but the loop must still terminate on schedule if it somehow did.
 *
 * The loop still asks for three identical reads in a row (stable >= 2), the
 * same count it asked for under the old fixed interval. That count was never
 * about surviving a slow poll — it was about surviving these pages' own
 * multi-frame settling: React mounts only after an async import resolves,
 * and a freshly-populated page can keep shifting layout for a frame or two
 * past that point. At 150ms a cadence three reads deep cost 300ms per page;
 * at frame cadence the same three reads cost a handful of milliseconds, so
 * there is no reason to relax the count along with the cadence. On its own,
 * though, three-in-a-row was not enough: it counts identical *layout* reads,
 * and forms.card.html and ConfirmDialog.card.html both hold a stable-looking
 * fallback-glyph layout for well over three frames before the real font
 * swaps in (see fontsSettled below, and its own comment above). fontsSettled()
 * is the second, independent gate that case needed — the two together, not a bigger
 * number for either alone, are what it took to match the old floor's result
 * exactly. Verified empirically against all 45 @dsCard pages in the repo:
 * every one measures the same contentHeight, scrollHeight and scrollWidth
 * this loop reported before the switch to frames, across repeated runs (see
 * the report accompanying this change).
 *
 * check-card-viewports.test.mjs's slow-readiness fixture is what proves the
 * 20s deadline still bounds a page that never settles, and it now mutates
 * its own height every animation frame — the same primitive this loop polls
 * on — rather than on a fixed millisecond tick: no two of the loop's reads
 * can straddle a real frame without the page having changed in between, and
 * the only way they could land on the same stale value is the loop's own
 * frame wait resolving through the fallback timer with no real frame firing
 * in between, which a live foreground tab does not do. */
const FRAME_FALLBACK_MS = 34;
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

  const nextFrame = () => new Promise((resolve) => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(); } };
    requestAnimationFrame(finish);
    setTimeout(finish, ${FRAME_FALLBACK_MS});
  });
  const fontsSettled = () => !document.fonts || document.fonts.status === 'loaded';

  let previous = null;
  let stable = 0;
  while (Date.now() < deadline) {
    const now = read();
    const key = JSON.stringify(now);
    stable = key === previous ? stable + 1 : 0;
    previous = key;
    if (stable >= 2 && now.rendered && fontsSettled()) return { ...now, timedOut: false };
    await nextFrame();
  }
  return { ...read(), timedOut: true };
})()`;

/* A page whose TCP connect never resolves (a stale IP, a dropped SYN, the
 * local static server wedged) leaves the CDP command carrying it unsettled
 * forever: neither Page.navigate nor Runtime.evaluate reject on their own,
 * confirmed by hand against a listener that accepts the connection and then
 * says nothing.
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

/* Target.createTarget, Target.attachToTarget, Emulation.setDeviceMetricsOverride
 * and the Animation.enable/setPlaybackRate pair below touch no network and no
 * page script — they are local bookkeeping the browser process itself
 * answers, so a hang here would mean a wedged or crashed Chromium rather than
 * a wedged local server, a narrower failure than Page.navigate's. Still the
 * same shape of risk (an unsettled CDP send leaves the caller's finally never
 * reached),
 * so they get the same NAVIGATE_TIMEOUT_MS bound for a uniform reason:
 * nothing measurePage awaits should be able to hang this gate forever. Named
 * generically (the method, not the page) since none of these carries a URL
 * to name. */
function boundedSend(cdp, method, params, sessionId) {
  return withTimeout(
    cdp.send(method, params, sessionId),
    NAVIGATE_TIMEOUT_MS,
    `${method} did not settle within ${NAVIGATE_TIMEOUT_MS}ms`,
  );
}

/* Freezes every animation on the page to its resting frame, so the card is
 * measured once, deterministically, instead of at whatever instant the
 * stability loop happens to observe. Confirmed against the CDP reference
 * (chromedevtools.github.io/devtools-protocol/tot/Animation): setPlaybackRate
 * sets the rate of "the document timeline" itself, not of any one animation
 * object, so a rate of 0 set here — before Runtime.evaluate, while the page
 * is still navigating and no animated element exists yet — freezes both
 * whatever is already running and whatever mounts later on this same
 * document. That second half is what these pages need: they transpile JSX in
 * the browser and only mount React (and therefore Spinner, ProgressBar or
 * Skeleton) after an async import resolves, well after this call returns.
 * Animation.enable has to run first — the domain's agent does not exist on a
 * session until it is enabled, the same requirement every other CDP domain
 * has. A CSS transform frozen at rate 0 still resolves to a real computed
 * box (typically the animation's 0% keyframe, since nothing has played yet),
 * so getBoundingClientRect keeps returning a stable, real value rather than
 * an undefined one. @param {{send: Function}} cdp @param {string} sessionId
 * @returns {Promise<void>} */
async function freezeAnimations(cdp, sessionId) {
  await boundedSend(cdp, 'Animation.enable', {}, sessionId);
  await boundedSend(cdp, 'Animation.setPlaybackRate', { playbackRate: 0 }, sessionId);
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
    // After navigation, before MEASURE_SCRIPT: this document's timeline now
    // exists (Page.navigate has committed) but nothing has rendered onto it
    // yet, so freezing here catches every animation this page ever runs.
    await freezeAnimations(cdp, sessionId);
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
      message: `${file} did not render — #root is empty after 20s. Check that frameworks/react/vendor/*.js is in sync (bun run check:vendor) and that node_modules is installed.`,
    };
  }

  // #root filled in but the stability loop never saw two identical reads
  // before its 20s deadline: whatever `measured` holds was captured at an
  // arbitrary, unrepeatable instant, not the page at rest. Routed to the
  // same 'unrendered' status as the branch above — both describe "the
  // browser ran but this page could not be measured", a skip-class condition
  // this file already treats as never a pass, and summarizeCards/skip()
  // handle it exactly as they do today with no plumbing change needed. Now
  // that freezeAnimations removes the one known cause (an infinitely
  // animating element), this branch is the guard that says so if it ever
  // stops being true.
  if (measured.timedOut) {
    return {
      file,
      status: 'unrendered',
      message: `${file} never stabilized — its measurement kept changing on every read for the full 20s deadline, so nothing here can be trusted as the page at rest.`,
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
 *  with — a navigate/evaluate timeout, a dropped local-server connection, a
 *  page-side exception surfaced through exceptionDetails, all realistic per the
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

/* How many pages measureCardPage runs at once. Each page already gets its
 * own CDP target (measurePage's first call), so the pages are independent
 * and could in principle all run at once — but a single headless Chromium
 * process still has one renderer doing the actual layout/paint work behind
 * every one of those targets, so asking it to do 45 at once would thrash it
 * and distort the very measurements this gate exists to take (the thing a
 * concurrency bound is supposed to prevent). 4-6 is the sensible range: high
 * enough that the wait-dominated per-page latency (fonts, the JSX transpile
 * round-trip, arenaReady) overlaps across pages instead of serializing, low
 * enough to stay well short of thrashing. Picked from the middle of that
 * range with no other tiebreaker. */
const PAGE_CONCURRENCY = 1;

/** Run `fn` over `items` with at most `limit` calls in flight at once,
 *  returning results in `items`' original order regardless of which call
 *  settles first — a worker keeps pulling the next unclaimed index and
 *  writes into that index's slot, so the slot a result lands in is decided
 *  before the call even starts, not by when it finishes.
 *  @template T, R
 *  @param {T[]} items @param {number} limit @param {(item: T) => Promise<R>} fn
 *  @returns {Promise<R[]>} */
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

/* findCardPages sorts by path, and four of the heaviest pages in the repo to
 * actually paint — brand.card.html, charts.card.html,
 * activity-feed.card.html and calendar.card.html — happen to sort first,
 * right next to each other. mapWithConcurrency's worker loop claims items in
 * plain array order, so under the identity order every wave of PAGE_CONCURRENCY
 * workers starts by claiming items 0..PAGE_CONCURRENCY-1 — those same four
 * pages, together, every run. Headless Chromium's software rasterizer
 * (--disable-gpu, one process behind every target) is not built to paint
 * several canvas/SVG-heavy or animated pages at once: confirmed by hand,
 * measured alone each of the four settles in under 3s, but with two or more
 * of them in the same wave at least one routinely rides MEASURE_SCRIPT's 20s
 * deadline out to a genuine timedOut — the "thrash the browser and distort
 * the measurements" failure PAGE_CONCURRENCY's own comment above already
 * names, just triggered by which pages share a wave rather than by their
 * count. Interleaving the dispatch order — not the output order, which
 * main() restores from `file` afterward — is what keeps pages that started
 * out adjacent from ever sharing a wave again. */
/** Reorders `items` by laying them into `groups` rows, filled row-major
 *  (item i goes to row `i % groups`), then reading the grid back out
 *  column-major (all of row 0, then all of row 1, ...). Two items closer
 *  together than `groups` in the input always land in different rows, and
 *  are therefore at least one row's length apart in the output — `ceil(items
 *  .length / groups)` positions, not `groups` itself, so the separation only
 *  clears a `groups`-wide mapWithConcurrency's wave once there are at least
 *  about `groups` items per row (`items.length` on the order of `groups²` or
 *  more). At this file's real scale — 45 pages, `groups` = PAGE_CONCURRENCY
 *  (5) — that holds comfortably (9 items per row), which is the only case
 *  this function is ever asked to handle.
 *  @template T @param {T[]} items @param {number} groups @returns {T[]} */
export function interleaveForDispatch(items, groups) {
  const width = Math.max(1, Math.min(groups, items.length || 1));
  const rows = Array.from({ length: width }, () => []);
  items.forEach((item, i) => rows[i % width].push(item));
  return rows.flat();
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

  // Dispatched interleaved (see interleaveForDispatch) so pages that sort
  // adjacent — and may therefore be adjacent in weight, as brand/charts/
  // activity-feed/calendar are — never share a concurrent wave; restored to
  // findCardPages' sorted order here by keying on each result's own `file`,
  // since mapWithConcurrency's output order follows whatever order it was
  // given, and that order is the interleaved one, not `pages`' own.
  let results;
  try {
    const dispatchOrder = interleaveForDispatch(pages, PAGE_CONCURRENCY);
    const byFile = new Map();
    await mapWithConcurrency(dispatchOrder, PAGE_CONCURRENCY, async (file) => {
      byFile.set(file, await measureCardPage(cdp, file, root, server.port));
    });
    results = pages.map((file) => byFile.get(file));
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
