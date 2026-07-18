/* Renders the Arena token language from its own source.
 *
 * Names and $descriptions come from tokens/src/*.json; VALUES come from
 * getComputedStyle on the live document, so the page exercises the whole chain
 * (JSON -> build -> CSS -> browser) instead of echoing the JSON back. A token
 * that resolves empty means the committed CSS is stale, and it is flagged
 * rather than displayed as if it were in effect.
 *
 * Served over HTTP only — it fetches its source, which file:// forbids.
 * Run: bun run demos
 */
import { flattenTokens, previewFor } from './scripts/lib/token-preview.mjs';

const root = document.documentElement;
const host = document.getElementById('sections');

/** Reads a custom property as the browser currently resolves it. */
const value = (name) => getComputedStyle(root).getPropertyValue(`--${name}`).trim();

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

async function loadTokens(file) {
  const res = await fetch(`tokens/src/${file}`);
  if (!res.ok) throw new Error(`cannot load tokens/src/${file}: ${res.status}`);
  return flattenTokens(await res.json());
}

/* One renderer per preview shape. Each returns the element that sits above the
 * name/value/description block, or null when the shape needs no visual. */
const PREVIEW = {
  swatch(token) {
    const node = el('div', 'swatch');
    node.style.background = `var(--${token.name})`;
    const pair = `${token.name}-content`;
    if (value(pair)) {
      node.style.color = `var(--${pair})`;
      node.textContent = 'Aa';
    }
    return node;
  },
  value: () => null,
};

function renderToken(token) {
  const resolved = value(token.name);
  const item = el('div', resolved ? 'item' : 'item item-missing');
  const preview = (PREVIEW[previewFor(token.group, token.$type)] ?? PREVIEW.value)(token);
  if (preview) item.append(preview);
  item.append(el('div', 'item-name', `--${token.name}`));
  item.append(el('div', 'item-val', resolved || 'does not resolve — rebuild: bun run build:tokens'));
  if (token.$description) item.append(el('div', 'item-desc', token.$description));
  return item;
}

/** @param {{eyebrow: string, title: string, note?: string, tokens: Array}} config */
export function renderSection({ eyebrow, title, note, tokens }) {
  const sec = el('section', 'sec');
  sec.append(el('div', 'eyebrow', eyebrow), el('div', 'h2', title));
  if (note) sec.append(el('p', 'note', note));
  const grid = el('div', 'grid');
  for (const token of tokens) grid.append(renderToken(token));
  sec.append(grid);
  const missing = tokens.filter((t) => !value(t.name)).length;
  const tally = el('div', missing ? 'tally tally-bad' : 'tally',
    missing ? `${tokens.length} tokens, ${missing} not resolving` : `${tokens.length} tokens, all resolving`);
  sec.append(tally);
  return sec;
}

/* Re-rendering (rather than patching) on a scope change is what keeps the page
 * honest: every value is read again from the new scope. */
const sections = [];
function paint() {
  host.replaceChildren(...sections.map((make) => make()));
}

async function main() {
  const palette = await loadTokens('palette.dark.json');
  const skin = palette.filter((t) => !t.name.startsWith('color-cat-'));
  const ramp = palette.filter((t) => t.name.startsWith('color-cat-'));

  sections.push(() => renderSection({
    eyebrow: 'Color',
    title: 'Skin',
    note: 'Each colour is defined beside its -content counterpart, the legible colour on top. '
      + 'Where a pair exists the swatch is labelled in its own content colour, which is the contract a skin defines. '
      + 'Values shown are the active theme.',
    tokens: skin,
  }));

  sections.push(() => {
    const sec = renderSection({
      eyebrow: 'Color',
      title: 'Categorical ramp',
      note: 'Identity only, never meaning. Slot order is fixed: slot N is always slot N, and a ninth series '
        + 'folds to Other rather than generating a hue.',
      tokens: ramp,
    });
    const strip = el('div', 'ramp');
    for (const token of ramp) {
      const slot = el('div', 'ramp-slot');
      slot.style.background = `var(--${token.name})`;
      strip.append(slot);
    }
    sec.insertBefore(strip, sec.querySelector('.grid'));
    return sec;
  });

  paint();

  document.querySelector('.themebtn').addEventListener('click', paint);
  const density = document.getElementById('density');
  density.addEventListener('click', () => {
    const compact = root.classList.toggle('arena-compact');
    density.textContent = compact ? 'Compact' : 'Comfortable';
    paint();
  });
}

main().catch((err) => {
  host.append(el('p', 'note', `Overview failed to load: ${err.message}`));
  throw err;
});
