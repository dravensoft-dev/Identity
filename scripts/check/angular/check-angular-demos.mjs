/* The Angular demo pages are the only place a person can exercise what happy-dom cannot:
 * motion, focus rings, layout. They cannot be gated the way React's *.card.html pages are,
 * because their script is git-ignored build output — on a fresh clone the page renders blank,
 * and a blank page passes a viewport-overflow check by having nothing to overflow. So this
 * gate is structural and portable: no browser, no bundler. PAGED is the coverage record, and
 * it carries the same bidirectional staleness rule COVERED does. */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { pascal, readLayer } from '../../lib/arena/layers.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

export const BUNDLE_DIR = 'build/demo/js';

export const PAGED = new Set([
  'Button',
  'Card',
  'Tooltip',
  'Dialog',
  'Select',
  'Toast',
  'ToastHost',
  'Sheet',
  'Grid',
  'BottomNav',
  'Menu',
  'ProgressBar',
  'Spinner',
  'SideNav',
  'IconButton',
  'Checkbox',
  'Switch',
  'Input',
  'Textarea',
  'RadioGroup',
  'SegmentedControl',
  'Tabs',
  'Pagination',
  'Table',
  'Calendar',
]);

export function pageProblems(tree, read, paged = PAGED) {
  const problems = [];
  const found = new Set();

  for (const [category, dirs] of Object.entries(tree)) {
    for (const dir of dirs) {
      const name = pascal(dir);
      const base = `frameworks/angular/components/${category}/${dir}`;
      const page = `${base}/${name}.card.html`;
      const entry = `${base}/${name}.card.entry.ts`;
      const pageSource = read(page);
      const entrySource = read(entry);
      const declared = paged.has(name);

      if (!declared) {
        if (pageSource !== null) {
          problems.push(`${page}: exists but ${name} is not in PAGED — add it, so the record states what a person can open`);
        }
        if (entrySource !== null) {
          problems.push(`${entry}: exists but ${name} is not in PAGED`);
        }
        continue;
      }

      found.add(name);

      if (pageSource === null) {
        problems.push(`${page}: PAGED names ${name} and the page is missing`);
      }
      if (entrySource === null) {
        problems.push(`${entry}: PAGED names ${name} and its page has no application to bootstrap`);
      }
      if (pageSource === null || entrySource === null) continue;

      const src = /<script[^>]*\bsrc="([^"]+)"/.exec(pageSource);
      if (!src) {
        problems.push(`${page}: loads no module script, so it renders an empty document`);
      } else if (!src[1].endsWith(`/${BUNDLE_DIR}/${name}.card.entry.js`)) {
        problems.push(
          `${page}: loads "${src[1]}", which is not this component's bundled entry `
          + `(…/${BUNDLE_DIR}/${name}.card.entry.js)`,
        );
      }

      if (/@dsCard/.test(pageSource)) {
        problems.push(
          `${page}: declares @dsCard. An Angular page's script is git-ignored build output, so on `
          + 'a fresh clone it renders blank — and check:cards would pass it for having nothing to '
          + 'overflow, which is a green gate over nothing.',
        );
      }

      if (!/bootstrapApplication\s*\(/.test(entrySource)) {
        problems.push(`${entry}: calls no bootstrapApplication, so the page mounts nothing`);
      }
      if (!/provideZonelessChangeDetection\s*\(/.test(entrySource)) {
        problems.push(
          `${entry}: does not provide zoneless change detection, and the layer ships no zone.js — `
          + 'without it nothing in the page ever re-renders',
        );
      }
      if (!/^import '@angular\/compiler';$/m.test(entrySource)) {
        problems.push(
          `${entry}: does not import '@angular/compiler'. ngc compiles Arena's own components AOT, `
          + 'but @angular/* ships partially compiled and its injectables need the JIT fallback in a '
          + 'browser bundle — without it the page throws before it mounts anything, the same reason '
          + 'the Angular test harness imports it.',
        );
      }
    }
  }

  for (const name of paged) {
    if (!found.has(name)) {
      problems.push(`PAGED names "${name}", which is no Angular component directory — stale entry`);
    }
  }

  if (found.size === 0) {
    problems.push(
      'found 0 Angular demo pages. An empty result set is a failure, not a clean pass: '
      + 'a gate iterating nothing reports nothing wrong with everything.',
    );
  }
  return { problems, pages: found.size };
}

function main() {
  const read = (rel) => {
    const path = join(repoRoot, rel);
    return existsSync(path) ? readFileSync(path, 'utf8') : null;
  };
  const { problems, pages } = pageProblems(readLayer('angular'), read);
  if (problems.length) {
    console.error(`check-angular-demos: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-angular-demos: ${pages} page(s) mount a zoneless app from ${BUNDLE_DIR}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
