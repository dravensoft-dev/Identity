/* Arena's own skin, expressed as the arena.config.json a consumer writes. Two things read
 * it: check-packages.ts, which runs the CLI over it and holds the result equivalent to the
 * Style Dictionary output, and the assembly, which writes it into each package as the
 * example a consumer starts from. Deriving it beats writing it twice, because the example
 * a reader copies is then the palette the gate proved.
 * A weight query is a list and never a `min..max` range: Google serves a range only when it
 * lies inside that family's own wght axis and answers 400 otherwise, and Arena declares
 * weights up to 900 across families whose axes stop at 700. A list is clamped to the
 * nearest weight the family has, so one query holds for every family. */

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

const typographyContract = (root) =>
  JSON.parse(readFileSync(join(root, 'contracts/design/typography.json'), 'utf8'));

export function fontWeights(root) {
  return Object.entries(typographyContract(root).fw)
    .filter(([key]) => !key.startsWith('$'))
    .map(([, token]) => token.$value)
    .sort((a, b) => a - b);
}

export function googleFontsUrl(family, weights) {
  return `${GOOGLE_FONTS}?family=${family.replace(/ /g, '+')}:wght@${weights.join(';')}&display=swap`;
}

export function fontEntries(root) {
  const weights = fontWeights(root);

  const out = {};
  for (const [role, token] of Object.entries(typographyContract(root).font)) {
    if (role.startsWith('$')) continue;
    const family = token.$value[0];
    out[role] = { family, src: googleFontsUrl(family, weights) };
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
