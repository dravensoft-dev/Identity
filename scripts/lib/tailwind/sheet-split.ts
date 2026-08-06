/* Cuts the compiled sheet in two where an adopter's own Tailwind would otherwise collide with
 * Arena's. The preflight is stock Tailwind and a project that already ships one gets a second
 * copy of every rule in it; the utilities are Arena's and are never optional. The cut is at
 * `@layer base`, and both halves keep the layer declarations, because `@layer properties;` is
 * declared before the four-name order and a half that dropped it would sort Tailwind's own
 * property fallbacks above everything else it defines. */

const ORDER = /^@layer [^{};]*;$/gm;
const BLOCK = /^@layer ([a-z-]+) \{$/gm;

function matchingBrace(css: string, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") {
      for (i += 1; i < css.length && css[i] !== c; i++) if (css[i] === '\\') i += 1;
      continue;
    }
    if (c === '/' && css[i + 1] === '*') { i = css.indexOf('*/', i + 2) + 1; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) return i; }
  }
  return -1;
}

function blocks(css: string) {
  return [...css.matchAll(BLOCK)].map((m) => ({ name: m[1], at: m.index, open: m.index + m[0].length - 1 }));
}

export function splitCompiledSheet(css: string) {
  const found = blocks(css);
  const base = found.find((b) => b.name === 'base');
  if (!base) {
    throw new Error('sheet-split: the compiled sheet carries no top-level `@layer base` block, so the '
      + 'preflight cannot be separated from the utilities. Tailwind\'s output shape moved.');
  }
  if (found.length === 1) {
    throw new Error('sheet-split: the compiled sheet holds nothing but the preflight, so one half would '
      + 'ship empty; a split that produces an empty file is a packaging defect, not a smaller download.');
  }
  const close = matchingBrace(css, base.open);
  if (close < 0) throw new Error('sheet-split: the `@layer base` block never closes');

  const declarations = [...css.matchAll(ORDER)].map((m) => m[0]);
  if (declarations.length === 0) {
    throw new Error('sheet-split: the compiled sheet declares no layer order, so neither half could '
      + 'establish one on its own');
  }
  const order = `${declarations.join('\n')}\n`;

  const head = css.slice(0, found[0].at);
  const withoutOrder = (text: string) => text.replace(ORDER, '').replace(/\n{3,}/g, '\n\n');

  return {
    base: order + css.slice(base.at, close + 1) + '\n',
    utilities: order + withoutOrder(head) + css.slice(found[0].at, base.at) + css.slice(close + 2),
  };
}
