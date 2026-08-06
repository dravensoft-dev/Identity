/* Builds the page that proves the emitted per-component CSS paints what the manifest's own
 * class string paints. Both sides live in ONE document, so the token layer, the preflight
 * and every inherited value are identical and the only difference left is the thing under
 * test. The selection is the whole resolved one rather than a single variant, because the
 * components concatenate sibling slots by hand and a page mounting one slot per element
 * could not see which of two equal-specificity classes wins. The one cast in the file is the
 * only place a manifest crosses into `tailwind-variants`' own types: a manifest selects a
 * compound variant on a boolean and defaults axes to one, which the library reconciles at
 * runtime and types as `string | string[]`. */

import { arenaTv } from '../../../frameworks/tailwind/Tv.ts';
import { arenaStyles } from '../../../frameworks/tailwind/ArenaStyles.ts';
import { classesManifest } from './component-css.ts';
import type { ComponentManifest } from './manifest-shapes.ts';

export function selections(manifest: ComponentManifest) {
  const out = [{ name: 'defaults', chosen: {} }];
  for (const [group, values] of Object.entries(manifest.variants ?? {}))
    for (const value of Object.keys(values)) out.push({ name: `${group}=${value}`, chosen: { [group]: value } });
  return out;
}

export function cases(manifest: ComponentManifest) {
  const recipe = arenaTv(manifest as Parameters<typeof arenaTv>[0]);
  const styles = arenaStyles(classesManifest(manifest));
  const out = [];
  for (const { name, chosen } of selections(manifest)) {
    const raw = recipe(chosen);
    const arena = styles(chosen);
    for (const slot of Object.keys(manifest.slots ?? {})) {
      out.push({
        id: `${manifest.component}|${slot}|${name}`,
        raw: raw[slot]?.() ?? '',
        arena: arena[slot]?.() ?? '',
      });
    }
  }
  return out;
}

export function parityPage(sheets, allCases) {
  const links = sheets.map((href: string) => `<link rel="stylesheet" href="${href}">`).join('\n');
  const rows = allCases.map(({ id, raw, arena }) =>
    `<div data-case="${id}"><span class="${raw}"></span><span class="${arena}"></span></div>`).join('\n');
  return `<!doctype html>\n<meta charset="utf-8">\n<title>Arena style parity</title>\n${links}\n`
    + `<div id="cases">\n${rows}\n</div>\n`;
}

export const COMPARE_SCRIPT = `(async () => {
  if (document.readyState !== 'complete') {
    await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  }
  const skip = new Set(['perspective-origin', 'transform-origin', 'inline-size', 'block-size',
    'width', 'height', 'webkit-logical-width', 'webkit-logical-height']);
  const out = [];
  for (const node of document.querySelectorAll('#cases > div')) {
    const [rawEl, arenaEl] = node.children;
    const a = getComputedStyle(rawEl);
    const b = getComputedStyle(arenaEl);
    const differing = [];
    for (const property of a) {
      if (skip.has(property)) continue;
      const left = a.getPropertyValue(property);
      const right = b.getPropertyValue(property);
      if (left !== right) differing.push(property + ': ' + left + ' vs ' + right);
    }
    if (differing.length > 0) out.push({ id: node.dataset.case, differing: differing.slice(0, 6) });
  }
  return { compared: document.querySelectorAll('#cases > div').length, mismatches: out };
})()`;
