/* Turns a consumer's arena.config.json into the one stylesheet Arena cannot ship: the
 * palette blocks, the @font-face rules and the import that pulls the package's own sheet
 * in. Everything else about a token is already decided and travels inside the package.
 * This module runs in the repository, where check-packages.mjs holds its output equivalent
 * to the Style Dictionary pipeline, and inside both npm packages, where it is the only
 * emitter there is. It reads no file and touches no network, so a path in the config is
 * emitted, never resolved, and the sheets a package ships arrive as an option. */

import {
  PALETTE_KEYS, POLARITIES, FONT_ROLES, GENERIC_FAMILIES, SOURCE_FORMATS,
  catKeys, requiredKeys,
} from './palette-keys.mjs';
import { validate, contrast } from './validate-palette.mjs';

const HEX = /^#[0-9a-fA-F]{6}$/;
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function defaultPalette(palettes) {
  return palettes.find((p) => p?.default === true) ?? palettes[0];
}

function paletteProblems(palette, index, seen) {
  const at = `palettes[${index}]`;
  const problems = [];
  if (!isObject(palette)) return [`${at}: not an object`];

  if (typeof palette.name !== 'string' || !KEBAB.test(palette.name)) {
    problems.push(`${at}.name: ${JSON.stringify(palette.name)} is not a kebab-case name`);
  } else if (seen.has(palette.name)) {
    problems.push(`${at}.name: ${palette.name} is declared twice`);
  } else {
    seen.add(palette.name);
  }

  if (!POLARITIES.includes(palette.polarity)) {
    problems.push(`${at}.polarity: ${JSON.stringify(palette.polarity)} is not one of ${POLARITIES.join(', ')}`);
  }

  if (!isObject(palette.colors)) {
    problems.push(`${at}.colors: not an object`);
    return problems;
  }

  for (const key of requiredKeys()) {
    if (!(key in palette.colors)) problems.push(`${at}.colors: missing ${key}`);
  }
  for (const [key, value] of Object.entries(palette.colors)) {
    if (!PALETTE_KEYS.includes(key)) {
      problems.push(`${at}.colors: ${key} is not an Arena palette key`);
      continue;
    }
    if (typeof value !== 'string' || !HEX.test(value)) {
      problems.push(`${at}.colors.${key}: ${JSON.stringify(value)} is not a #rrggbb hex`);
    }
  }
  return problems;
}

function fontProblems(fonts) {
  if (!isObject(fonts)) return ['fonts: not an object'];
  const problems = [];
  for (const role of Object.keys(FONT_ROLES)) {
    const font = fonts[role];
    if (!isObject(font)) {
      problems.push(`fonts.${role}: missing; Arena reads --font-display, --font-body and --font-mono`);
      continue;
    }
    if (typeof font.family !== 'string' || font.family.trim() === '') {
      problems.push(`fonts.${role}.family: not a family name`);
    }
    if (typeof font.src !== 'string' || font.src.trim() === '') {
      problems.push(`fonts.${role}.src: not a URL or a path`);
    }
    if (font.fallback !== undefined && !Array.isArray(font.fallback)) {
      problems.push(`fonts.${role}.fallback: not an array of family names`);
    }
  }
  for (const role of Object.keys(fonts)) {
    if (!(role in FONT_ROLES)) problems.push(`fonts.${role}: not an Arena font role`);
  }
  return problems;
}

export const COMPONENTS_SHEET = 'css/components.css';
export const PREFLIGHT_SHEET = 'css/base.css';
export const STYLESHEET_KEYS = ['components', 'preflight'];

export function stylesheetProblems(stylesheet, sheets) {
  if (!isObject(stylesheet)) return ['stylesheet: not an object'];
  const problems = [];

  for (const key of Object.keys(stylesheet)) {
    if (!STYLESHEET_KEYS.includes(key)) problems.push(`stylesheet.${key}: not an Arena stylesheet key`);
  }
  if (stylesheet.preflight !== undefined && typeof stylesheet.preflight !== 'boolean') {
    problems.push(`stylesheet.preflight: ${JSON.stringify(stylesheet.preflight)} is not true or false`);
  }
  if (!Array.isArray(stylesheet.components) || stylesheet.components.length === 0) {
    problems.push('stylesheet.components: name at least one component sheet, or drop stylesheet to import them all');
    return problems;
  }
  if (!sheets) {
    problems.push('stylesheet: the sheets this package ships cannot be read from beside this command, '
      + 'so a name in it can be held to nothing');
    return problems;
  }

  const seen = new Set();
  for (const name of stylesheet.components) {
    if (typeof name !== 'string' || !sheets.components.includes(name)) {
      problems.push(`stylesheet.components: ${JSON.stringify(name)} is not a sheet this package ships, `
        + `which are ${sheets.components.join(', ')}`);
      continue;
    }
    if (seen.has(name)) problems.push(`stylesheet.components: ${name} is named twice`);
    seen.add(name);
  }
  return problems;
}

export function configProblems(config, sheets = null) {
  if (!isObject(config)) return ['the configuration is not an object'];
  const problems = [];

  if (!Array.isArray(config.palettes) || config.palettes.length === 0) {
    problems.push('palettes: declare at least one palette');
  } else {
    const seen = new Set();
    config.palettes.forEach((p, i) => problems.push(...paletteProblems(p, i, seen)));
    const defaults = config.palettes.filter((p) => isObject(p) && p.default === true);
    if (defaults.length > 1) {
      problems.push(`palettes: ${defaults.length} palettes declare default; exactly one reaches :root`);
    }
  }

  problems.push(...fontProblems(config.fonts));
  if (config.stylesheet !== undefined) problems.push(...stylesheetProblems(config.stylesheet, sheets));
  return problems;
}

export function paletteReports(config) {
  const out = [];
  for (const palette of config.palettes) {
    const mode = palette.polarity;
    const surface = palette.colors['base-100'];
    const ramp = catKeys().map((k) => palette.colors[k]).filter(Boolean);
    const messages = [];

    if (ramp.length) {
      for (const [name, state, detail] of validate(ramp, { mode, surface }).report) {
        if (state === false || state === 'fail') messages.push(`ramp, ${name}: ${detail}`);
      }
    }

    const text = [
      ['base-content on base-100', palette.colors['base-content'], palette.colors['base-100']],
      ['base-content on base-200', palette.colors['base-content'], palette.colors['base-200']],
      ['primary-content on primary', palette.colors['primary-content'], palette.colors.primary],
      ['error on base-200', palette.colors.error, palette.colors['base-200']],
    ];
    for (const [what, fg, bg] of text) {
      if (!fg || !bg) continue;
      const ratio = contrast(fg, bg);
      if (ratio < 4.5) messages.push(`text, ${what}: ${ratio.toFixed(2)}:1, under the 4.5:1 Arena holds itself to`);
    }

    if (messages.length) out.push({ palette: palette.name, messages });
  }
  return out;
}

function family(name, fallback) {
  return [name, ...fallback]
    .map((f) => (GENERIC_FAMILIES.has(f) ? f : `'${f}'`))
    .join(',');
}

export function isStylesheet(src) {
  const path = src.split('?')[0];
  return path.endsWith('.css') || /^https?:\/\/fonts\.googleapis\.com\//.test(src);
}

function fontFace(font) {
  const extension = Object.keys(SOURCE_FORMATS).find((e) => font.src.split('?')[0].endsWith(e));
  const format = extension ? ` format('${SOURCE_FORMATS[extension]}')` : '';
  return [
    '@font-face{',
    `  font-family:'${font.family}';`,
    `  font-style:${font.style ?? 'normal'};`,
    `  font-weight:${font.weight ?? '400 900'};`,
    `  font-display:${font.display ?? 'swap'};`,
    `  src:url('${font.src}')${format};`,
    '}',
  ].join('\n');
}

function block(selector, declarations) {
  return [`${selector}{`, ...declarations.map((d) => `  ${d}`), '}'].join('\n');
}

function colourDeclarations(palette) {
  return PALETTE_KEYS
    .filter((key) => key in palette.colors)
    .map((key) => `--color-${key}:${palette.colors[key].toLowerCase()};`);
}

export function scopedImports(packageName, stylesheet, sheets) {
  const lines = [];
  for (const layer of sheets.layers) {
    if (layer === PREFLIGHT_SHEET && stylesheet.preflight === false) continue;
    if (layer === COMPONENTS_SHEET) {
      for (const name of stylesheet.components) lines.push(`@import '${packageName}/css/components/${name}.css';`);
      continue;
    }
    lines.push(`@import '${packageName}/${layer}';`);
  }
  return lines;
}

export function themeCss(config, options = {}) {
  const { packageName = '@dravensoft/arena-react', importHeader = true, source = 'arena.config.json', sheets = null } = options;
  const fallbackFor = (role) => config.fonts[role].fallback ?? FONT_ROLES[role];

  const parts = [`/* GENERATED by arena-to-prod from ${source}. Edit that, not this file. */`];
  if (importHeader) {
    parts.push(config.stylesheet
      ? scopedImports(packageName, config.stylesheet, sheets).join('\n')
      : `@import '${packageName}/arena.css';`);
  }

  const roles = Object.keys(FONT_ROLES);
  const fontSheets = [...new Set(roles.map((r) => config.fonts[r].src).filter(isStylesheet))];
  for (const sheet of fontSheets) parts.push(`@import url('${sheet}');`);
  for (const role of roles) {
    if (!isStylesheet(config.fonts[role].src)) parts.push(fontFace(config.fonts[role]));
  }

  const fallback = defaultPalette(config.palettes);
  parts.push(block(':root', [
    ...colourDeclarations(fallback),
    `--picker-invert:${fallback.polarity === 'light' ? 0 : 1};`,
    ...Object.keys(FONT_ROLES).map((role) => `--font-${role}:${family(config.fonts[role].family, fallbackFor(role))};`),
  ]));

  for (const palette of config.palettes) {
    if (palette === fallback) continue;
    parts.push(block(`.arena-${palette.name}`, [
      ...colourDeclarations(palette),
      `--picker-invert:${palette.polarity === 'light' ? 0 : 1};`,
    ]));
  }

  return `${parts.join('\n\n')}\n`;
}
