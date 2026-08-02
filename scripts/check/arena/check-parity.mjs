/* Renders each component's two playground pages in one browser and fails when they paint
 * differently, because the pages differ in one path segment and take the same query string,
 * so a difference between them is a difference in the component. It compares INK rather than
 * boxes: the layers are free to nest differently, and a box-set comparison reports that
 * freedom as a defect -- measured, it flagged 30 of 55 pairs that paint identically. The
 * stage box alone is the opposite failure, because .pg-stage declares a min-height and any
 * component under it produces an identical box whatever it draws: the three SideNav members
 * each differ by ~12000 pixels behind an identical stage. Animations are frozen and the text
 * caret is hidden before the shot: neither a shimmer phase nor a blink is a difference, and a
 * caret is not a CSS animation, so freezing alone leaves a 1px column flickering. */

import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../../lib/arena/static-server.mjs';
import { findChromium, launchChromium } from '../../lib/arena/chromium.mjs';
import { connect } from '../../lib/arena/cdp.mjs';
import { skipExitCode } from '../../lib/arena/arena-scripts-vars.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { pagePaths } from './check-playgrounds.mjs';

export const TOLERANCE = 2;

export const VIEWPORT = { width: 1280, height: 900 };

const AUTHORED_TWICE = 'React authors this component\'s appearance as inline style objects while Angular '
  + 'renders the shared manifest, so the two copies are only equal by hand and have drifted. It goes when '
  + 'the component renders the manifest.';

export const DIVERGENT = new Map([
  ['Calendar', `3331 pixels across the grid. ${AUTHORED_TWICE}`],
  ['CalendarEvent', `3294 pixels across the grid it is drawn into. ${AUTHORED_TWICE}`],
  ['DoughnutChart', '2 pixels on the ring, worst channel 46, at a single point of one arc. The three SVG '
    + 'charts carry no manifest by design and are outside the migration, so this one is measured and not '
    + 'yet explained: it is most likely a rounding difference in a path coordinate, and it is declared here '
    + 'rather than tolerated silently, because a threshold that hid it would hide a real one-pixel defect too.'],
]);

export function pairPages(pages = pagePaths()) {
  const byComponent = new Map();
  for (const page of pages) {
    const file = page.slice(page.lastIndexOf('/') + 1);
    const component = file.replace('.demo.generated.html', '');
    const layer = page.split('/')[1];
    const found = byComponent.get(component) ?? {};
    found[layer] = page;
    byComponent.set(component, found);
  }
  const pairs = [];
  for (const [component, found] of [...byComponent].sort(([a], [b]) => a.localeCompare(b))) {
    const layers = Object.keys(found).sort();
    if (layers.length === 2) pairs.push({ component, pages: found, layers });
  }
  return pairs;
}

export function differs(seen) {
  if (seen.error) return true;
  if (seen.sizes) return true;
  return seen.diff > 0;
}

export function describe(component, seen) {
  if (seen.error) return `${component}: could not be measured — ${seen.error}`;
  if (seen.sizes) {
    const [aw, ah, bw, bh] = seen.sizes;
    return `${component}: the stages are ${seen.layers[0]} ${aw}x${ah} and ${seen.layers[1]} ${bw}x${bh}, `
      + 'so the component does not occupy the same box in the two layers';
  }
  const [x0, y0, x1, y1] = seen.bbox;
  return `${component}: ${seen.diff} of ${seen.total} stage pixels differ (worst channel ${seen.worst}) `
    + `over x ${x0}..${x1}, y ${y0}..${y1} of ${seen.w}x${seen.h}`;
}

export function parityProblems(component, seen, divergent = DIVERGENT) {
  const declared = divergent.has(component);
  if (differs(seen)) {
    return declared ? [] : [describe(component, seen)];
  }
  if (declared) {
    return [`${component}: DIVERGENT names it and the two pages now paint identically — delete the entry, `
      + 'because an exception that has stopped being true is what this map exists to catch'];
  }
  return [];
}

export function mapProblems(pairs, divergent = DIVERGENT) {
  const known = new Set(pairs.map((p) => p.component));
  const problems = [];
  for (const [component, reason] of divergent) {
    if (!known.has(component)) {
      problems.push(`DIVERGENT names ${component}, and no component emits a page pair called that`);
      continue;
    }
    if (typeof reason !== 'string' || reason.trim() === '') {
      problems.push(`DIVERGENT names ${component} with no reason, and a reason is the whole entry`);
    }
  }
  if (pairs.length === 0) {
    problems.push('found 0 page pairs — an empty result set is a failure rather than a clean pass; check the discovery path');
  }
  return problems;
}

const NAVIGATE_TIMEOUT_MS = 15_000;
const EVALUATE_TIMEOUT_MS = 45_000;
const READY_DEADLINE_MS = 20_000;

const NO_CARET = 'html *, html *::before, html *::after { caret-color: transparent !important; }';

const READY = `(async () => {
  const hide = document.createElement('style');
  hide.textContent = ${JSON.stringify(NO_CARET)};
  document.head.appendChild(hide);
  const deadline = Date.now() + ${READY_DEADLINE_MS};
  const stage = () => document.querySelector('.pg-stage');
  while (Date.now() < deadline) {
    const found = stage();
    if (found && found.children.length > 0) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 400));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const found = stage();
  if (!found) return null;
  const r = found.getBoundingClientRect();
  return { x: r.x, y: r.y, width: Math.round(r.width), height: Math.round(r.height), drew: found.children.length > 0 };
})()`;

export const diffScript = (a, b) => `(async () => {
  const load = (d) => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('a capture did not decode'));
    i.src = 'data:image/png;base64,' + d;
  });
  const [ia, ib] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]);
  if (ia.width !== ib.width || ia.height !== ib.height) return { sizes: [ia.width, ia.height, ib.width, ib.height] };
  const read = (img) => {
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height).data;
  };
  const A = read(ia);
  const B = read(ib);
  let diff = 0;
  let worst = 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < A.length; i += 4) {
    const delta = Math.max(
      Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]),
      Math.abs(A[i + 2] - B[i + 2]), Math.abs(A[i + 3] - B[i + 3]),
    );
    if (delta <= ${TOLERANCE}) continue;
    diff += 1;
    if (delta > worst) worst = delta;
    const pixel = i / 4;
    const x = pixel % ia.width;
    const y = (pixel - x) / ia.width;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { total: A.length / 4, diff, worst, bbox: diff > 0 ? [x0, y0, x1, y1] : null, w: ia.width, h: ia.height };
})()`;

function withTimeout(promise, ms, message) {
  let timer;
  const bound = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}

function boundedSend(cdp, method, params, sessionId) {
  return withTimeout(cdp.send(method, params, sessionId), NAVIGATE_TIMEOUT_MS,
    `${method} did not settle within ${NAVIGATE_TIMEOUT_MS}ms`);
}

async function inTab(cdp, fn) {
  const { targetId } = await boundedSend(cdp, 'Target.createTarget', { url: 'about:blank' });
  try {
    const { sessionId } = await boundedSend(cdp, 'Target.attachToTarget', { targetId, flatten: true });
    await boundedSend(cdp, 'Page.enable', {}, sessionId);
    await boundedSend(cdp, 'Runtime.enable', {}, sessionId);
    await boundedSend(cdp, 'Emulation.setDeviceMetricsOverride',
      { ...VIEWPORT, deviceScaleFactor: 1, mobile: false }, sessionId);
    return await fn(sessionId, (expression) => withTimeout(
      cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId),
      EVALUATE_TIMEOUT_MS, `Runtime.evaluate did not settle within ${EVALUATE_TIMEOUT_MS}ms`));
  } finally {
    try { await boundedSend(cdp, 'Target.closeTarget', { targetId }); } catch { void 0; }
  }
}

export async function capture(cdp, url) {
  return inTab(cdp, async (sessionId, evaluate) => {
    await withTimeout(cdp.send('Page.navigate', { url }, sessionId), NAVIGATE_TIMEOUT_MS,
      `${url}: Page.navigate did not settle within ${NAVIGATE_TIMEOUT_MS}ms`);
    await boundedSend(cdp, 'Animation.enable', {}, sessionId);
    await boundedSend(cdp, 'Animation.setPlaybackRate', { playbackRate: 0 }, sessionId);
    const { result, exceptionDetails } = await evaluate(READY);
    if (exceptionDetails) throw new Error(`${url}: ${exceptionDetails.text}`);
    const box = result.value;
    if (!box) throw new Error(`${url}: no .pg-stage after ${READY_DEADLINE_MS}ms — run bun run build first`);
    if (!box.drew) throw new Error(`${url}: the stage is empty, so there is nothing to compare`);
    const { data } = await withTimeout(cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 },
      captureBeyondViewport: true,
    }, sessionId), EVALUATE_TIMEOUT_MS, `${url}: Page.captureScreenshot did not settle`);
    return data;
  });
}

export async function comparePair(cdp, port, pair) {
  try {
    const shots = [];
    for (const layer of pair.layers) {
      shots.push(await capture(cdp, `http://127.0.0.1:${port}/${pair.pages[layer]}`));
    }
    const seen = await inTab(cdp, async (_sessionId, evaluate) => {
      const { result, exceptionDetails } = await evaluate(diffScript(shots[0], shots[1]));
      if (exceptionDetails) throw new Error(exceptionDetails.text);
      return result.value;
    });
    return { ...seen, layers: pair.layers };
  } catch (err) {
    return { error: err.message, layers: pair.layers };
  }
}

export function summarize(problems, pairs) {
  if (problems.length > 0) {
    return {
      failed: true,
      text: [`check-parity: ${problems.length} problem(s)\n`, ...problems.map((p) => `  ${p}`)].join('\n'),
    };
  }
  const declared = DIVERGENT.size;
  return {
    failed: false,
    text: `check-parity: ${pairs.length} page pair(s) rendered in one browser, `
      + `${pairs.length - declared} paint identically and ${declared} are declared in DIVERGENT with a reason`,
  };
}

function skip(reason) {
  const code = skipExitCode();
  console.error(`check-parity: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; the repository declares ARENA_CHECK_STRICT=1, so this environment overrides it.');
  process.exit(code);
}

async function main() {
  const pairs = pairPages();
  const problems = mapProblems(pairs);
  if (problems.length > 0) {
    console.error(summarize(problems, pairs).text);
    process.exit(1);
  }

  const browser = findChromium();
  if (!browser.path) skip(`${browser.reason}, so no page was rendered and nothing is known about whether the layers agree`);

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

  const found = [];
  try {
    for (const pair of pairs) {
      found.push(...parityProblems(pair.component, await comparePair(cdp, server.port, pair)));
    }
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }

  const summary = summarize(found, pairs);
  if (summary.failed) {
    console.error(summary.text);
    process.exit(1);
  }
  console.log(summary.text);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
