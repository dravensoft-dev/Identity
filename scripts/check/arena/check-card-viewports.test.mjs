import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from '../../lib/arena/static-server.mjs';
import { findChromium, launchChromium } from '../../lib/arena/chromium.mjs';
import { connect } from '../../lib/arena/cdp.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import {
  parseDsCard, classify, summarizeCards, findCardPages, UNDER_RUN_SLACK,
  measurePage, measureCardPage, mapWithConcurrency, interleaveForDispatch, MEASURE_SCRIPT,
} from './check-card-viewports.mjs';

const browser = findChromium();

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

test('MEASURE_SCRIPT re-checks document.fonts.status rather than trusting a single await', () => {
  assert.match(MEASURE_SCRIPT, /fontsSettled = \(\) => !document\.fonts \|\| document\.fonts\.status === 'loaded'/);
});

test('MEASURE_SCRIPT still reports timedOut: true on exhaustion, never a passing shape', () => {
  assert.match(MEASURE_SCRIPT, /return \{ \.\.\.read\(\), timedOut: true \};/);
});

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
    file: 'intro/guidelines/icons.html',
    declared: { width: 700, height: 200 },
    measured: { scrollWidth: 700, scrollHeight: 200, clientWidth: 700, clientHeight: 200, contentHeight: 200, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'ok');
});

test('content taller than the declared box clips, and the message names both numbers and the fix', () => {
  const r = classify({
    file: 'frameworks/react/components/charts/Charts.card.html',
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
    file: 'frameworks/react/components/brand/app-logo/AppLogo.card.html',
    declared: { width: 700, height: 660 },
    measured: { scrollWidth: 732, scrollHeight: 660, clientWidth: 700, clientHeight: 660, contentHeight: 660, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'clip');
  assert.match(r.message, /732x660/);
});

test(`content shorter than the declared box by more than ${UNDER_RUN_SLACK}px warns, and never fails`, () => {
  const r = classify({
    file: 'intro/guidelines/colors-status.html',
    declared: { width: 700, height: 600 },
    measured: { scrollWidth: 700, scrollHeight: 600, clientWidth: 700, clientHeight: 600, contentHeight: 150, rendered: true, timedOut: false },
  });
  assert.equal(r.status, 'under');
  assert.match(r.message, /450/);
});

test('a small under-run is not worth a word', () => {
  const r = classify({
    file: 'intro/guidelines/colors-status.html',
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

test('a page that timed out without ever stabilizing is a skip-class condition, not a pass', () => {
  const r = classify({
    file: 'frameworks/react/components/feedback/Feedback.card.html',
    declared: { width: 900, height: 460 },

    measured: { scrollWidth: 900, scrollHeight: 460, clientWidth: 900, clientHeight: 460, contentHeight: 400, rendered: true, timedOut: true },
  });
  assert.equal(r.status, 'unrendered');
  assert.match(r.message, /never stabilized/i, 'the message says plainly that the page never settled');
  assert.match(r.message, /Feedback\.card\.html/, 'the message names the page');
});

test('findCardPages finds every page that declares, and nothing that does not', () => {
  const pages = findCardPages(repoRoot);
  assert.ok(pages.includes('intro/guidelines/icons.html'));
  assert.ok(pages.includes('frameworks/react/components/charts/Charts.card.html'));
  assert.ok(!pages.includes('intro/Arena - Overview.html'), 'the Overview is not a card');
  assert.ok(!pages.includes('intro/Dravensoft Identity.dc.html'), 'the brand manual is not a card');
  assert.ok(pages.every((p) => !p.includes('node_modules')));
  assert.deepEqual(pages, [...pages].sort(), 'pages come back sorted, so output is stable');
});

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

  assert.deepEqual(out, [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]);
});

test('interleaveForDispatch spreads originally-adjacent items out of the first wave, at this file\'s real scale', () => {
  const items = Array.from({ length: 45 }, (_, i) => i);
  const groups = 5;
  const out = interleaveForDispatch(items, groups);
  const positionOf = new Map(out.map((item, pos) => [item, pos]));

  for (const item of [0, 1, 2, 3]) assert.ok(positionOf.has(item));
  const positions = [0, 1, 2, 3].map((item) => positionOf.get(item));

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
