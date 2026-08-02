/* check-parity narrowed to the pairs it is named, for iterating on one component: the gate
 * renders all 55 and takes minutes, and a migration wants an answer per edit. It is NOT a
 * gate and never joins GATES, because a narrowed run that finds nothing is indistinguishable
 * from a full one that does; every summary it prints says how many pairs it did not look at,
 * and a name matching no pair is an error rather than a silent zero. The comparison itself is
 * the gate's own capture() and comparePair(), imported rather than restated, so a probe that
 * disagrees with the gate is impossible. --shots=<dir> writes the two captures, because the
 * pixel count says a pair differs and the picture says how. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from '../../lib/arena/static-server.mjs';
import { findChromium, launchChromium } from '../../lib/arena/chromium.mjs';
import { connect } from '../../lib/arena/cdp.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { capture, comparePair, describe, differs, pairPages } from './check-parity.mjs';

export function selectPairs(names, pairs) {
  if (names.length === 0) {
    return {
      selected: [],
      problems: ['the probe was named nothing to compare, and a run over nothing prints the '
        + 'same clean summary as a run that found no difference'],
    };
  }
  const known = new Map(pairs.map((p) => [p.component, p]));
  const selected = [];
  const problems = [];
  for (const name of names) {
    const found = known.get(name);
    if (found) selected.push(found);
    else problems.push(`${name}: no component emits a page pair called that`);
  }
  return { selected, problems };
}

export function parseProbeArgs(argv) {
  const names = [];
  let shots = null;
  for (const arg of argv) {
    if (arg.startsWith('--shots=')) { shots = arg.slice('--shots='.length); continue; }
    if (arg.startsWith('--')) throw new Error(`parity-probe: unrecognised argument "${arg}"; it takes component names and --shots=<dir>`);
    names.push(arg);
  }
  return { names, shots };
}

export function summarize(lines, compared, total) {
  const unlooked = total - compared;
  return [
    ...lines.map((l) => `  ${l}`),
    `parity-probe: compared ${compared} of ${total} pair(s); the other ${unlooked} were not `
    + 'looked at, so this says nothing about them. Close with bun run check:parity.',
  ].join('\n');
}

async function writeShots(cdp, port, pair, dir) {
  mkdirSync(dir, { recursive: true });
  for (const layer of pair.layers) {
    const data = await capture(cdp, `http://127.0.0.1:${port}/${pair.pages[layer]}`);
    writeFileSync(join(dir, `${pair.component}.${layer}.png`), Buffer.from(data, 'base64'));
  }
  console.log(`  wrote ${pair.layers.map((l) => join(dir, `${pair.component}.${l}.png`)).join(' and ')}`);
}

async function main() {
  const { names, shots } = parseProbeArgs(process.argv.slice(2));
  const pairs = pairPages();
  const { selected, problems } = selectPairs(names, pairs);
  if (problems.length > 0) {
    for (const problem of problems) console.error(`parity-probe: ${problem}`);
    process.exit(1);
  }

  const browser = findChromium();
  if (!browser.path) {
    console.error(`parity-probe: ${browser.reason}`);
    process.exit(1);
  }

  const server = await startStaticServer(root);
  let chrome;
  let cdp;
  try {
    chrome = await launchChromium(browser.path);
    cdp = await connect(chrome.wsUrl);
  } catch (err) {
    await server.close();
    chrome?.kill();
    console.error(`parity-probe: ${browser.path} could not be driven: ${err.message}`);
    process.exit(1);
  }

  const lines = [];
  let differed = false;
  try {
    for (const pair of selected) {
      const seen = await comparePair(cdp, server.port, pair);
      if (differs(seen)) {
        differed = true;
        lines.push(describe(pair.component, seen));
        if (shots) await writeShots(cdp, server.port, pair, shots);
      } else {
        lines.push(`${pair.component}: identical`);
      }
    }
  } finally {
    cdp.close();
    chrome.kill();
    await server.close();
  }

  const text = summarize(lines, selected.length, pairs.length);
  if (differed) {
    console.error(text);
    process.exit(1);
  }
  console.log(text);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
