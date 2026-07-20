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
  measurePage,
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
 * after that — settling at 19.5s past readiness, i.e. 31.5s after
 * navigation, well inside the budget the *pre-fix* script mistakenly
 * granted itself (readiness time + 20s = 32s), but nowhere near the honest
 * single 20s budget the fix computes before either await.
 *
 * Confirmed by hand against the unfixed script: measurePage rejected at
 * 30152ms with "Runtime.evaluate did not settle within 30000ms" — the outer
 * CDP timeout fired first because the in-page one never had a chance to.
 * Against the fix it resolves at ~20.1s with timedOut: true.
 *
 * The mutation ticks every 100ms — faster than the loop's 250ms poll — so
 * no two poll reads 250ms apart can ever coincide on the same value before
 * the deadline; without that margin, two polls could land inside the same
 * tick by chance and register as "stable" long before 20s, making the test
 * flaky rather than a real test of the deadline. */
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
  const grow = setInterval(() => {
    n += 1;
    box.style.height = (10 + n) + 'px';
    if (n >= 195) clearInterval(grow); // 195 * 100ms = 19.5s of continuous change
  }, 100);
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

test('a page that never rendered is a skip-class condition, not a pass', () => {
  const r = classify({
    file: 'a.html',
    declared: { width: 700, height: 200 },
    measured: { scrollWidth: 700, scrollHeight: 200, clientWidth: 700, clientHeight: 200, contentHeight: 0, rendered: false, timedOut: true },
  });
  assert.equal(r.status, 'unrendered');
  assert.match(r.message, /did not render/i);
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
