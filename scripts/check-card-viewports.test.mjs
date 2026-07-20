import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';
import { connect } from './lib/cdp.mjs';
import { measurePage } from './check-card-viewports.mjs';

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
