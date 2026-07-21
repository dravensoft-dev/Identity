import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';
import { connect } from './lib/cdp.mjs';
import {
  parseDsCard, classify, summarizeCards, skipExitCode, findCardPages, UNDER_RUN_SLACK,
  measurePage, measureCardPage, mapWithConcurrency, interleaveForDispatch, MEASURE_SCRIPT,
} from './check-card-viewports.mjs';

/* The only test here that needs a browser. It skips — loudly, in the
 * runner's output — where there is none, for the same reason the gate does. */
const browser = findChromium();

const page = (bodyStyle) => `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0}#box{${bodyStyle}}</style></head>
<body><div id="box"></div></body></html>`;

test('measurePage reports content that fits, and content that over-runs', { skip: browser.path ? false : browser.reason }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-cards-'));
  writeFileSync(join(root, 'fits.html'), page('width:300px;height:150px'));
  writeFileSync(join(root, 'tall.html'), page('width:300px;height:300px'));
  writeFileSync(join(root, 'wide.html'), page('width:600px;height:100px'));

  const server = await startStaticServer(root);
  const chrome = await launchChromium(browser.path);
  const cdp = await connect(chrome.wsUrl);
  const at = (name) => `http://127.0.0.1:${server.port}/${name}`;

  try {
    const fits = await measurePage(cdp, at('fits.html'), { width: 400, height: 200 });
    assert.equal(fits.scrollHeight, 200, 'a page that fits reports the viewport height');
    assert.equal(fits.scrollWidth, 400);
    assert.equal(fits.contentHeight, 150, 'contentHeight is the real content bottom, not the clamped scrollHeight');
    assert.equal(fits.timedOut, false);

    const tall = await measurePage(cdp, at('tall.html'), { width: 400, height: 200 });
    assert.equal(tall.scrollHeight, 300);
    assert.equal(tall.clientHeight, 200);

    const wide = await measurePage(cdp, at('wide.html'), { width: 400, height: 200 });
    assert.equal(wide.scrollWidth, 600);
    assert.equal(wide.clientWidth, 400);
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }
});

/* Reproduces Arena's own dropdown pattern (Menu.jsx, Select's open state): a
 * position:relative wrapper, itself a direct child of #root, holding a
 * position:absolute overlay that extends past the wrapper's own bottom.
 * contentHeight used to inspect only document.body.children — i.e. #root —
 * whose rendered height follows the wrapper's in-flow height (20px) because
 * an absolutely positioned descendant contributes nothing to an ancestor's
 * height. The overlay's true bottom (320px) never entered the scan. */
const nestedAbsolutePage = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0}</style></head>
<body><div id="root"><div id="wrapper" style="position:relative;height:20px">
<div id="overlay" style="position:absolute;top:0;left:0;width:100px;height:320px"></div>
</div></div></body></html>`;

test('contentHeight follows an absolutely positioned descendant at any depth', { skip: browser.path ? false : browser.reason }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-cards-'));
  writeFileSync(join(root, 'nested-absolute.html'), nestedAbsolutePage);

  const server = await startStaticServer(root);
  const chrome = await launchChromium(browser.path);
  const cdp = await connect(chrome.wsUrl);

  try {
    const result = await measurePage(cdp, `http://127.0.0.1:${server.port}/nested-absolute.html`, { width: 400, height: 200 });
    assert.equal(result.contentHeight, 320, 'the overlay is nested two levels deep and out of flow, but it is still the true content bottom');
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }
});

/* A raw TCP listener that accepts the connection and then says nothing —
 * no response, ever. Confirmed by hand against this exact fixture: Chromium's
 * Page.navigate does not settle even at 8s against it. It reproduces the same
 * failure shape the reviewer hit pointing at an address whose TCP connect
 * times out (a dropped SYN), without needing the OS's own multi-minute
 * connect timeout to prove the gate's bound, not Chromium's, is what fires. */
test('measurePage rejects instead of hanging when a page never answers', { skip: browser.path ? false : browser.reason, timeout: 20_000 }, async () => {
  // Tracked so the fixture's own teardown can force them shut: node's
  // net.Server#close only invokes its callback once every connection has
  // ended, and Chromium's socket into this listener stays open (nothing
  // here ever told it to go away) until something destroys it — otherwise
  // this test's own cleanup would hang, independent of measurePage.
  const sockets = new Set();
  const silent = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise((resolve) => silent.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${silent.address().port}/never-answers.html`;

  const chrome = await launchChromium(browser.path);
  const cdp = await connect(chrome.wsUrl);

  try {
    await assert.rejects(
      measurePage(cdp, url, { width: 400, height: 200 }),
      (err) => {
        assert.match(err.message, /did not settle/, 'the rejection names the timeout, not just "it failed"');
        assert.ok(err.message.includes(url), 'the rejection names the page that would not load');
        return true;
      },
    );
  } finally {
    cdp.close();
    chrome.kill();
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => silent.close(resolve));
  }
});

/* Models the reviewer's exact repro: window.arenaReady resolves slowly
 * (12s), and content the stability loop watches keeps changing for a while
 * after that — well past the honest single 20s budget the script computes
 * before either await, so the loop never gets to see three identical reads
 * in a row and must report its own timedOut: true.
 *
 * Confirmed by hand against the unfixed (pre-deadline) script: measurePage
 * rejected at 30152ms with "Runtime.evaluate did not settle within 30000ms"
 * — the outer CDP timeout fired first because the in-page one never had a
 * chance to. Against the fix it resolves at ~20.1s with timedOut: true.
 *
 * The mutation is driven by requestAnimationFrame, chained indefinitely,
 * rather than a millisecond tick — the same primitive the settling loop
 * itself now polls on (see FRAME_FALLBACK_MS's comment in
 * check-card-viewports.mjs). Incrementing on every real frame, starting well
 * before the loop ever takes its first read at 12s, means no two of the
 * loop's reads can straddle a real frame without this fixture having changed
 * the box's height at least once in between — unlike a fixed-interval tick,
 * which would need retuning any time the loop's own polling interval changed
 * to keep proving the same thing. The only way two reads could coincide on a
 * stale value is the loop's own frame wait resolving through its fallback
 * timer with no real frame firing at all in between, which does not happen
 * against a live, foregrounded Chromium target. */
const slowReadinessPage = `<!doctype html><html><head><meta charset="utf-8">
<script>
window.arenaReady = () => new Promise((resolve) => setTimeout(resolve, 12000));
</script>
<style>html,body{margin:0;padding:0}</style></head>
<body><div id="root"><div id="box" style="height:10px"></div></div>
<script>
setTimeout(() => {
  const box = document.getElementById('box');
  let n = 0;
  const grow = () => {
    n += 1;
    box.style.height = (10 + n) + 'px';
    if (n < 3000) requestAnimationFrame(grow); // keeps changing well past the 20s deadline
  };
  requestAnimationFrame(grow);
}, 12000);
</script>
</body></html>`;

test('a slow-but-honest page times out inside the script instead of past the outer CDP bound', { skip: browser.path ? false : browser.reason, timeout: 30_000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-cards-'));
  writeFileSync(join(root, 'slow-readiness.html'), slowReadinessPage);

  const server = await startStaticServer(root);
  const chrome = await launchChromium(browser.path);
  const cdp = await connect(chrome.wsUrl);

  try {
    const result = await measurePage(cdp, `http://127.0.0.1:${server.port}/slow-readiness.html`, { width: 400, height: 200 });
    assert.equal(result.timedOut, true, 'the script must report its own honest timeout, not let the outer CDP bound reject first');
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }
});

/* MEASURE_SCRIPT is a string evaluated inside the page, so its runtime
 * behaviour — does a settled page actually confirm across real frames, does
 * a starved rAF actually fall back, does the deadline actually hold — can
 * only be proven against a real browser, which the tests above already do
 * (measurePage, and the slow-readiness timeout test in particular). What
 * follows is what a plain string check on the source can still catch: that
 * the shape the browser tests exercise is still there at all, so a future
 * edit that silently drops the fallback timer, the frame wait, or the
 * three-reads threshold fails here even when nobody runs the browser suite
 * for it. This is not a substitute for the browser-backed tests — it is a
 * cheap trip-wire for the same properties they verify at runtime. */
test('MEASURE_SCRIPT settles on requestAnimationFrame instead of a fixed interval', () => {
  assert.match(MEASURE_SCRIPT, /requestAnimationFrame\(finish\)/, 'the stability loop must wait on a real frame');
  assert.match(MEASURE_SCRIPT, /await nextFrame\(\);/, 'the loop\'s own wait must be the frame helper, not an inline sleep');
  assert.doesNotMatch(MEASURE_SCRIPT, /STABILITY_POLL_MS/, 'the old fixed-interval constant must be gone');
});

test('MEASURE_SCRIPT backs the frame wait with a bounded fallback timer', () => {
  assert.match(MEASURE_SCRIPT, /setTimeout\(finish,\s*34\)/, 'a starved rAF (backgrounded/throttled tab) must still let the loop advance toward the 20s deadline');
});

test('MEASURE_SCRIPT still computes the 20s deadline before awaiting readiness', () => {
  const deadlineAt = MEASURE_SCRIPT.indexOf('const deadline');
  const readinessAt = MEASURE_SCRIPT.indexOf('const readiness');
  assert.ok(deadlineAt >= 0 && readinessAt >= 0, 'both must be present in the script');
  assert.ok(deadlineAt < readinessAt, 'the deadline must be computed before readiness is awaited, so it bounds the whole script, not just the stability loop');
});

test('MEASURE_SCRIPT still requires three consecutive identical reads, rendered content, and settled fonts, before accepting', () => {
  assert.match(MEASURE_SCRIPT, /stable >= 2 && now\.rendered && fontsSettled\(\)/, 'the confirming-read count did not change along with the polling cadence, and the font-race gate must be part of the same accept check, not a separate one that could be skipped');
});

/* fontsSettled() is the fix for a real regression this change first
 * introduced and then closed (see its comment in check-card-viewports.mjs):
 * document.fonts.ready resolves once, but forms.card.html and
 * ConfirmDialog.card.html both request a font face — an icon glyph, a
 * monospace label — only after that promise has already settled, so a fast
 * frame-cadence loop could lock onto three identical reads of the
 * fallback-glyph layout before the real font ever swaps in. This is a plain
 * string check on the guard existing at all; the browser-backed regression
 * itself is what the before/after measurement diff in the report proves, not
 * this test. */
test('MEASURE_SCRIPT re-checks document.fonts.status rather than trusting a single await', () => {
  assert.match(MEASURE_SCRIPT, /fontsSettled = \(\) => !document\.fonts \|\| document\.fonts\.status === 'loaded'/);
});

test('MEASURE_SCRIPT still reports timedOut: true on exhaustion, never a passing shape', () => {
  assert.match(MEASURE_SCRIPT, /return \{ \.\.\.read\(\), timedOut: true \};/);
});

/* Fakes the CDP transport, not the browser — measureCardPage's job is to
 * catch whatever measurePage rejects with, and measurePage rejects purely
 * off what cdp.send does, so no real Chromium is needed to prove it. This
 * runs even where the browser-backed tests above skip. */
function fakeCdp(failingUrls) {
  return {
    send: async (method, params) => {
      switch (method) {
        case 'Target.createTarget': return { targetId: 't' };
        case 'Target.attachToTarget': return { sessionId: 's' };
        case 'Emulation.setDeviceMetricsOverride': return {};
        case 'Animation.enable': return {};
        case 'Animation.setPlaybackRate': return {};
        case 'Page.navigate':
          if (failingUrls.has(params.url)) throw new Error('stalled connection');
          return {};
        case 'Runtime.evaluate':
          return {
            result: {
              value: {
                scrollWidth: 100, scrollHeight: 100, clientWidth: 100, clientHeight: 100,
                contentHeight: 100, rendered: true, timedOut: false,
              },
            },
          };
        case 'Target.closeTarget': return {};
        default: throw new Error(`fakeCdp: unexpected method ${method}`);
      }
    },
  };
}

test('measureCardPage records a rejecting page as unrendered, and the sweep still measures the pages after it', async () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-cards-'));
  const card = (name) => `<!-- @dsCard group="G" viewport="100x100" name="${name}" -->\n<!doctype html>`;
  writeFileSync(join(root, 'a.html'), card('a'));
  writeFileSync(join(root, 'b.html'), card('b'));
  writeFileSync(join(root, 'c.html'), card('c'));

  const port = 9999;
  const cdp = fakeCdp(new Set([`http://127.0.0.1:${port}/b.html`]));

  const results = [];
  for (const file of ['a.html', 'b.html', 'c.html']) {
    results.push(await measureCardPage(cdp, file, root, port));
  }

  assert.equal(results.length, 3, 'the failing page does not stop the loop before the pages after it');
  assert.equal(results[0].status, 'ok');
  assert.equal(results[1].status, 'unrendered', 'a rejection is recorded as a result, not thrown past the loop');
  assert.match(results[1].message, /b\.html/, 'the message names the page');
  assert.match(results[1].message, /stalled connection/, 'the message names the underlying error, not just "could not measure"');
  assert.equal(results[2].status, 'ok', 'the page after the failing one is still measured');
});

test('parseDsCard reads the group, name and viewport off the first line', () => {
  const html = '<!-- @dsCard group="Components" viewport="700x460" name="Display" subtitle="Card · Badge" -->\n<!doctype html>';
  assert.deepEqual(parseDsCard(html), { group: 'Components', name: 'Display', width: 700, height: 460 });
});

test('parseDsCard reads attributes in any order', () => {
  const html = '<!-- @dsCard group="Console" viewport="1280x820" subtitle="s" name="Delivery Console" -->';
  assert.equal(parseDsCard(html).name, 'Delivery Console');
  assert.equal(parseDsCard(html).width, 1280);
});

test('parseDsCard returns null for a page that declares nothing', () => {
  assert.equal(parseDsCard('<!doctype html><html></html>'), null);
});

test('parseDsCard only reads the first line — a @dsCard further down is not a declaration', () => {
  assert.equal(parseDsCard('<!doctype html>\n<!-- @dsCard group="X" viewport="10x10" name="n" -->'), null);
});

test('parseDsCard returns null when viewport is missing', () => {
  assert.equal(parseDsCard('<!-- @dsCard group="X" name="n" -->'), null);
});

test('parseDsCard returns null when viewport is not WxH', () => {
  assert.equal(parseDsCard('<!-- @dsCard group="X" viewport="large" name="n" -->'), null);
});

test('content that fits exactly is ok', () => {
  const r = classify({
    file: 'guidelines/icons.html',
    declared: { width: 700, height: 200 },
    measured: { scrollWidth: 700, scrollHeight: 200, clientWidth: 700, clientHeight: 200, contentHeight: 200, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'ok');
});

test('content taller than the declared box clips, and the message names both numbers and the fix', () => {
  const r = classify({
    file: 'frameworks/react/components/charts/charts.card.html',
    declared: { width: 900, height: 760 },
    measured: { scrollWidth: 900, scrollHeight: 1345, clientWidth: 900, clientHeight: 760, contentHeight: 1345, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'clip');
  assert.match(r.message, /900x760/);
  assert.match(r.message, /900x1345/);
  assert.match(r.message, /585/);
});

test('content wider than the declared box clips too', () => {
  const r = classify({
    file: 'frameworks/react/components/brand/brand.card.html',
    declared: { width: 700, height: 660 },
    measured: { scrollWidth: 732, scrollHeight: 660, clientWidth: 700, clientHeight: 660, contentHeight: 660, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'clip');
  assert.match(r.message, /732x660/);
});

test(`content shorter than the declared box by more than ${UNDER_RUN_SLACK}px warns, and never fails`, () => {
  const r = classify({
    file: 'guidelines/colors-status.html',
    declared: { width: 700, height: 600 },
    measured: { scrollWidth: 700, scrollHeight: 600, clientWidth: 700, clientHeight: 600, contentHeight: 150, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'under');
  assert.match(r.message, /450/);
});

test('a small under-run is not worth a word', () => {
  const r = classify({
    file: 'guidelines/colors-status.html',
    declared: { width: 700, height: 200 },
    measured: { scrollWidth: 700, scrollHeight: 200, clientWidth: 700, clientHeight: 200, contentHeight: 140, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'ok');
});

test('summarizeCards fails on clips only, and counts the warnings separately', () => {
  const s = summarizeCards([
    { file: 'a.html', status: 'ok', message: '' },
    { file: 'b.html', status: 'clip', message: 'b over-runs' },
    { file: 'c.html', status: 'under', message: 'c is mostly empty' },
  ]);
  assert.equal(s.failed, 1);
  assert.equal(s.warned, 1);
  assert.match(s.text, /b over-runs/);
  assert.match(s.text, /c is mostly empty/);
});

test('summarizeCards on a clean sweep says so and fails nothing', () => {
  const s = summarizeCards([{ file: 'a.html', status: 'ok', message: '' }]);
  assert.equal(s.failed, 0);
  assert.match(s.text, /1 page/);
});

/* menu-pagination.card.html under-runs by 131px and is deliberately not
 * being corrected yet, so this is the exact combination the first clean run
 * after it lands in check-all will print: no clip, no unrendered page, but
 * a warning. The old tail claimed "every one fits" directly under a list of
 * under-runs — a contradiction of the block it sits right below. */
test('summarizeCards does not claim a clean sweep when it just printed under-run warnings', () => {
  const s = summarizeCards([
    { file: 'a.html', status: 'ok', message: '' },
    { file: 'menu-pagination.card.html', status: 'under', message: 'menu-pagination.card.html renders 131px short' },
  ]);
  assert.equal(s.failed, 0, 'a warning never fails the build');
  assert.equal(s.warned, 1);
  assert.doesNotMatch(s.text, /every one fits/, 'the tail must not contradict the warning block above it');
  assert.match(s.text, /2 page/);
  assert.match(s.text, /1 warning/);
});

test('a page that never rendered is a skip-class condition, not a pass', () => {
  const r = classify({
    file: 'a.html',
    declared: { width: 700, height: 200 },
    measured: { scrollWidth: 700, scrollHeight: 200, clientWidth: 700, clientHeight: 200, contentHeight: 0, rendered: false, timedOut: true },
  });
  assert.equal(r.status, 'unrendered');
  assert.match(r.message, /did not render/i);
});

/* Distinct from the test above: here #root filled in (rendered: true) but
 * the stability loop never saw two identical reads before its 20s deadline —
 * the shape a page still carrying a live animation left after freezeAnimations
 * would have. classify must not fall through to the ok/clip/under branches
 * and score whatever `measured` happened to hold at that arbitrary instant;
 * a timed-out measurement is untrustworthy regardless of what it says. */
test('a page that timed out without ever stabilizing is a skip-class condition, not a pass', () => {
  const r = classify({
    file: 'frameworks/react/components/feedback/feedback.card.html',
    declared: { width: 900, height: 460 },
    // Numbers chosen so that, if this were wrongly treated as a normal
    // reading, it would classify 'ok' (nothing over-runs, nothing under-runs
    // by more than UNDER_RUN_SLACK) — proving the timedOut branch is what
    // catches it, not an incidental clip or under-run.
    measured: { scrollWidth: 900, scrollHeight: 460, clientWidth: 900, clientHeight: 460, contentHeight: 400, rendered: true, timedOut: true },
  });
  assert.equal(r.status, 'unrendered');
  assert.match(r.message, /never stabilized/i, 'the message says plainly that the page never settled');
  assert.match(r.message, /feedback\.card\.html/, 'the message names the page');
});

test('skipExitCode is 2 normally and 1 under strict', () => {
  assert.equal(skipExitCode({}), 2);
  assert.equal(skipExitCode({ ARENA_CHECK_STRICT: '1' }), 1);
  assert.equal(skipExitCode({ CI: 'true' }), 1);
});

test('findCardPages finds every page that declares, and nothing that does not', () => {
  const pages = findCardPages(join(import.meta.dirname, '..'));
  assert.ok(pages.includes('guidelines/icons.html'));
  assert.ok(pages.includes('frameworks/react/components/charts/charts.card.html'));
  assert.ok(!pages.includes('Arena - Overview.html'), 'the Overview is not a card');
  assert.ok(!pages.includes('Dravensoft Identity.dc.html'), 'the brand manual is not a card');
  assert.ok(pages.every((p) => !p.includes('node_modules')));
  assert.deepEqual(pages, [...pages].sort(), 'pages come back sorted, so output is stable');
});

/* main() feeds mapWithConcurrency the sorted output of findCardPages, so
 * this is the guarantee the whole sweep's output ordering rests on: results
 * land in `items` order, never in the order calls happen to settle. Delays
 * are deliberately not in file order, and at least 15ms apart pairwise, so
 * timer jitter cannot flip their completion order by accident —
 * `completions` is a real, not incidental, check that the calls really did
 * finish out of order, proving the assertion on `results` is testing the
 * ordering guarantee and not just restating the input. */
test('mapWithConcurrency keeps results in filename order even when a later file answers first', async () => {
  const files = ['a.html', 'b.html', 'c.html', 'd.html'];
  const delayMs = { 'a.html': 120, 'b.html': 5, 'c.html': 80, 'd.html': 35 };
  const completions = [];

  const results = await mapWithConcurrency(files, 4, async (file) => {
    await new Promise((r) => setTimeout(r, delayMs[file]));
    completions.push(file);
    return { file, status: 'ok' };
  });

  assert.deepEqual(completions, ['b.html', 'd.html', 'c.html', 'a.html'], 'sanity check: the calls really did settle out of filename order');
  assert.deepEqual(results.map((r) => r.file), files, 'results stay in filename order regardless of which call settled first');
});

test('mapWithConcurrency never runs more than `limit` calls at once', async () => {
  let inFlight = 0;
  let peak = 0;
  const items = Array.from({ length: 10 }, (_, i) => i);

  await mapWithConcurrency(items, 3, async (i) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 10));
    inFlight -= 1;
    return i;
  });

  assert.ok(peak <= 3, `peak concurrency was ${peak}, expected at most 3`);
  assert.equal(peak, 3, 'sanity check: the bound is actually reached, not just never exceeded');
});

test('interleaveForDispatch reads a row-major grid back out column-major', () => {
  const items = Array.from({ length: 12 }, (_, i) => i);
  const out = interleaveForDispatch(items, 4);
  // Row-major into 4 rows then read column-major: row0=[0,4,8], row1=[1,5,9],
  // row2=[2,6,10], row3=[3,7,11] -> flat = [0,4,8,1,5,9,2,6,10,3,7,11].
  assert.deepEqual(out, [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]);
});

/* The property that actually matters, at the scale check-card-viewports.mjs
 * runs at: with 45 pages and PAGE_CONCURRENCY 5, each row holds
 * ceil(45/5) = 9 items, so two items that started fewer than 5 apart always
 * land at least 9 dispatch positions apart — comfortably outside any single
 * 5-wide wave mapWithConcurrency could draw from. (The guarantee is really
 * "at least a row's length apart", which only clears `groups` once there are
 * enough items per row; a tiny input with few items per group would not get
 * this, but 45 pages at PAGE_CONCURRENCY 5 does, which is the only case this
 * file ever runs.) This reproduces the exact regression found by hand: pages
 * 0-3 in findCardPages' sorted order (brand, charts, activity-feed,
 * calendar) are the four heaviest to paint, and under the old identity
 * dispatch order they were always each other's first wave. */
test('interleaveForDispatch spreads originally-adjacent items out of the first wave, at this file\'s real scale', () => {
  const items = Array.from({ length: 45 }, (_, i) => i);
  const groups = 5;
  const out = interleaveForDispatch(items, groups);
  const positionOf = new Map(out.map((item, pos) => [item, pos]));

  for (const item of [0, 1, 2, 3]) assert.ok(positionOf.has(item));
  const positions = [0, 1, 2, 3].map((item) => positionOf.get(item));
  // No two of the four land within `groups` positions of each other, so no
  // wave of `groups` concurrent workers can ever draw two of them together.
  for (let a = 0; a < positions.length; a += 1) {
    for (let b = a + 1; b < positions.length; b += 1) {
      assert.ok(Math.abs(positions[a] - positions[b]) >= groups, `items ${a} and ${b} landed too close: positions ${positions[a]} and ${positions[b]}`);
    }
  }
});

test('interleaveForDispatch is a permutation — every item appears exactly once', () => {
  const items = ['a.html', 'b.html', 'c.html', 'd.html', 'e.html'];
  const out = interleaveForDispatch(items, 3);
  assert.deepEqual([...out].sort(), [...items].sort());
  assert.equal(out.length, items.length);
});
