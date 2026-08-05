/* The shape a consumer's arena.config.json declares, stated once. The key list is a
 * literal rather than a read of contracts/design/palette.dark.json, because this file
 * ships inside the npm packages where that source does not exist; the paired suite
 * asserts the two agree, so a colour added to the skin fails here first. */

export const PALETTE_KEYS = [
  'base-100', 'base-200', 'base-300', 'base-content',
  'primary', 'primary-content',
  'secondary', 'secondary-content',
  'neutral', 'neutral-content',
  'info', 'info-content',
  'success', 'success-content',
  'warning', 'warning-content',
  'error', 'error-content', 'error-fill',
  'cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7', 'cat-8',
];

export const OPTIONAL_KEYS = new Set(['error-fill']);

export const CAT_SLOTS = 8;

export const POLARITIES = ['dark', 'light'];

export const FONT_ROLES = {
  display: ['system-ui', 'sans-serif'],
  body: ['system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'monospace'],
};

export const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'math', 'emoji', 'fangsong',
]);

export const SOURCE_FORMATS = {
  '.woff2': 'woff2',
  '.woff': 'woff',
  '.ttf': 'truetype',
  '.otf': 'opentype',
};

export const catKeys = () => PALETTE_KEYS.filter((k) => /^cat-\d+$/.test(k));

export const requiredKeys = () => PALETTE_KEYS.filter((k) => !OPTIONAL_KEYS.has(k));
