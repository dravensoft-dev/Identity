/* Arena's own skin, expressed as the arena.config.json a consumer writes. Two things read
 * it: check-packages.mjs, which runs the CLI over it and holds the result equivalent to the
 * Style Dictionary output, and the assembly, which writes it into each package as the
 * example a consumer starts from. Deriving it beats writing it twice, because the example
 * a reader copies is then the palette the gate proved. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2';

const skin = (root, theme) =>
  JSON.parse(readFileSync(join(root, `contracts/design/palette.${theme}.json`), 'utf8')).color;

export function paletteColors(root, theme) {
  const out = {};
  for (const [key, token] of Object.entries(skin(root, theme))) {
    if (!key.startsWith('$')) out[key] = token.$value.hex;
  }
  return out;
}

export function fontEntries(root) {
  const typography = JSON.parse(readFileSync(join(root, 'contracts/design/typography.json'), 'utf8'));
  const weights = Object.entries(typography.fw)
    .filter(([k]) => !k.startsWith('$'))
    .map(([, t]) => t.$value)
    .sort((a, b) => a - b);
  const range = `${weights[0]}..${weights.at(-1)}`;

  const out = {};
  for (const [role, token] of Object.entries(typography.font)) {
    if (role.startsWith('$')) continue;
    const family = token.$value[0];
    const query = `family=${family.replace(/ /g, '+')}:wght@${range}&display=swap`;
    out[role] = { family, src: `${GOOGLE_FONTS}?${query}` };
  }
  return out;
}

export function arenaConfig(root, themes = ['dark', 'light']) {
  return {
    palettes: themes.map((theme, i) => ({
      name: theme,
      ...(i === 0 ? { default: true } : {}),
      polarity: theme === 'light' ? 'light' : 'dark',
      colors: paletteColors(root, theme),
    })),
    fonts: fontEntries(root),
  };
}
