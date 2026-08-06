/* Proves the emitted per-component CSS paints what the manifest's own class string paints.
 * The oracle is `Utilities.generated.css`, which is why that file survives as a build-time
 * artifact after it stops being published. Both sides are measured in one document, so only
 * the thing under test differs, and reduced motion is measured as a second pass because a
 * `motion-reduce:` variant is hoisted to a sibling `@media` block rather than interleaved
 * the way `@layer utilities` orders it, which is the axis most likely to regress and the one
 * a default `getComputedStyle` cannot reach. */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { startStaticServer } from '../../lib/arena/static-server.ts';
import { findChromium, launchChromium } from '../../lib/arena/chromium.ts';
import { connect } from '../../lib/arena/cdp.ts';
import { layerManifests } from '../../lib/tailwind/tailwind-compile.ts';
import { COMPARE_SCRIPT, cases, parityPage } from '../../lib/tailwind/style-parity.ts';
import { sheetPath } from '../../build/tailwind/build-tailwind.ts';

export const PAGE = 'frameworks/tailwind/StyleParity.generated.html';
const TIMEOUT_MS = 60_000;

export function sheetsFor(manifests) {
  return [
    '/intro/styles.css',
    '/frameworks/tailwind/Utilities.generated.css',
    ...[...manifests.keys()].map((file) => `/${sheetPath(file)}`),
  ];
}

export function allCases(manifests) {
  return [...manifests.values()].flatMap((manifest) => cases(manifest));
}

export function writePage(manifests, base = root) {
  const html = parityPage(sheetsFor(manifests), allCases(manifests));
  writeFileSync(join(base, PAGE), html);
  return html;
}

function withTimeout(promise, ms, message) {
  return Promise.race([promise, new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms).unref?.();
  })]);
}

export async function measure(cdp, url, reducedMotion) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  try {
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }],
    }, sessionId);
    await withTimeout(cdp.send('Page.navigate', { url }, sessionId), TIMEOUT_MS, `${url}: navigate stalled`);
    const { result, exceptionDetails } = await withTimeout(
      cdp.send('Runtime.evaluate', { expression: COMPARE_SCRIPT, awaitPromise: true, returnByValue: true }, sessionId),
      TIMEOUT_MS, `${url}: evaluate stalled`,
    );
    if (exceptionDetails) throw new Error(`${url}: ${exceptionDetails.text} ${exceptionDetails.exception?.description ?? ''}`);
    return result.value;
  } finally {
    try { await cdp.send('Target.closeTarget', { targetId }); } catch {  }
  }
}

export function problemsFrom(pass, label) {
  if (pass.compared === 0) {
    return [`${label}: the page mounted no case at all, so this run proves nothing`];
  }
  return pass.mismatches.map(({ id, differing }) =>
    `${label}: ${id} does not match its manifest's own class string: ${differing.join('; ')}`);
}

function skip(reason) {
  console.log(`check-style-parity: SKIP, ${reason}`);
  process.exit(2);
}

async function main() {
  const browser = findChromium();
  if (!browser.path) skip(browser.reason);

  const manifests = layerManifests(root);
  writePage(manifests);

  const server = await startStaticServer(root);
  let chrome;
  let cdp;
  try {
    chrome = await launchChromium(browser.path);
    cdp = await connect(chrome.wsUrl);
  } catch (err) {
    await server.close();
    chrome?.kill();
    skip(`${browser.path} could not be driven: ${(err as Error).message}`);
  }

  const problems = [];
  let compared = 0;
  try {
    const url = `http://127.0.0.1:${server.port}/${PAGE}`;
    for (const [label, reduced] of [['at rest', false], ['under reduced motion', true]]) {
      const pass = await measure(cdp, url, reduced);
      compared += pass.compared;
      problems.push(...problemsFrom(pass, label));
    }
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }

  if (problems.length > 0) {
    for (const problem of problems.slice(0, 40)) console.error(problem);
    if (problems.length > 40) console.error(`...and ${problems.length - 40} more`);
    console.error(`check-style-parity: ${problems.length} mismatch(es) across ${compared} comparison(s)`);
    process.exit(1);
  }
  console.log(`check-style-parity: ${compared} rendered comparison(s) match the manifest they came from, `
    + `across ${manifests.size} manifest(s), at rest and under reduced motion`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
