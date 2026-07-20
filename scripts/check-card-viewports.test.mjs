import test from 'node:test';
import assert from 'node:assert/strict';
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
