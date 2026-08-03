/* What both package builds share: the exclusion list that decides what never ships, the
 * copy that honours it, the CSS chain each package carries, and the manifest templates.
 * `arena` because it reads two framework layers and the repository root. Nothing here
 * compiles anything; each layer's own builder does that with its own toolchain. */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, sep, basename } from 'node:path';
import { repoRoot } from './repo-root.mjs';
import { kebab } from './layers.mjs';
import { manifestFiles } from '../tailwind/tailwind-compile.mjs';

export const EXCLUDED_NAMES = new Set(['node_modules', 'dist', 'vendor', 'test', 'build']);

export const EXCLUDED_PATTERNS = [
  /\.test\.(mjs|[jt]sx?)$/,
  /\.card\.html$/,
  /\.card\.entry\.[jt]sx?$/,
  /\.demo\.generated\.html$/,
  /\.demo\.entry\.generated\.[jt]sx?$/,
  /\.behaviour\.json$/,
  /\.prompt\.md$/,
  /\.generated\.js$/,
  /^tsconfig\..*\.json$/,
  /^BehaviourDelegated\.json$/,
];

export const CSS_CHAIN = [
  { from: 'contracts/design/reset.css', to: 'css/reset.css' },
  { from: 'contracts/design-generated/typography.generated.css', to: 'css/typography.css' },
  { from: 'contracts/design-generated/spacing.generated.css', to: 'css/spacing.css' },
  { from: 'contracts/design-generated/effects.generated.css', to: 'css/effects.css' },
  { from: 'contracts/design/colors.css', to: 'css/colors.css' },
  { from: 'contracts/design/environment.css', to: 'css/environment.css' },
];

export const arenaCssHeader = (name) => [
  `/* ${name} -- the invariant half of Arena's stylesheet.`,
  '   Import this FIRST, then the file arena-theme wrote from your arena.config.json,',
  '   whose palette and font values are meant to win. reset.css leads so anything can',
  '   override it, and colors.css derives its muted levels from --color-base-content,',
  '   so it follows the palette rather than defining one. environment.css composes the',
  "   device's safe-area insets with the spacing scale and defines no length of its own. */",
].join('\n');

export function excluded(name) {
  return EXCLUDED_NAMES.has(name) || EXCLUDED_PATTERNS.some((p) => p.test(name));
}

export function collectFiles(dir, keep = () => true) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (excluded(entry.name) || entry.name.startsWith('.')) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (keep(full)) found.push(full);
    }
  };
  if (existsSync(dir)) walk(dir);
  return found;
}

export function reset(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

export function write(dir, rel, content) {
  const full = join(dir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

export function copy(from, dir, rel) {
  const full = join(dir, rel);
  mkdirSync(dirname(full), { recursive: true });
  copyFileSync(from, full);
  return full;
}

export function copyTree(from, dir, rel, keep) {
  const written = [];
  for (const file of collectFiles(from, keep)) {
    written.push(copy(file, dir, join(rel, relative(from, file))));
  }
  return written;
}

export function writeCssChain(dir, name, extra = [], root = repoRoot) {
  const chain = [...CSS_CHAIN, ...extra];
  for (const entry of chain) {
    if (entry.content !== undefined) write(dir, entry.to, entry.content);
    else copy(join(root, entry.from), dir, entry.to);
  }
  const imports = chain.map(({ to }) => `@import './${to.split(sep).join('/')}';`);
  write(dir, 'arena.css', `${arenaCssHeader(name)}\n${imports.join('\n')}\n`);
  return chain.map((c) => c.to);
}

export const SHEET_BANNERS = {
  base: [
    '/* Tailwind\'s preflight, and nothing of Arena\'s own.',
    '   Arena needs it: a form control that inherits nothing falls back to 13.33px Arial, and a',
    '   <button> styled that way is 20% off in every measurement that matters.',
    '   If your project already runs Tailwind, its preflight does the same job and you may import',
    "   './css/components.css' alone instead of './arena.css' to avoid a second copy. Doing that",
    '   makes the order yours to get right: this half must come before Arena\'s components. */',
  ].join('\n'),
  components: [
    '/* Every component Arena draws, in one import.',
    '   This is never optional: without it a component renders unstyled, silently.',
    '   Import ./css/components/<name>.css instead to pay only for what you render; each of those',
    '   imports ./css/prelude.css itself, so one alone is safe. */',
  ].join('\n'),
};

export function componentSheets(css, split, root = repoRoot) {
  const { base } = split(css);
  const dir = join(root, 'frameworks', 'tailwind');
  const files = manifestFiles(join(dir, 'components'))
    .map((file) => file.replace(/\.manifest\.json$/, '.styles.generated.css'));
  if (files.length === 0) {
    throw new Error('package-assembly: no component stylesheet was found, so the package would ship '
      + 'a barrel that imports nothing and every component would render unstyled');
  }
  const named = files.map((file) => ({
    to: join('css', 'components', `${kebab(basename(file).split('.')[0])}.css`),
    content: readFileSync(file, 'utf8').replace(/@import '(?:\.\.\/)+Prelude\.generated\.css';/, "@import '../prelude.css';"),
  }));
  const barrel = named.map(({ to }) => `@import './${basename(to)}';`).join('\n');
  return [
    { to: join('css', 'base.css'), content: `${SHEET_BANNERS.base}\n${base}` },
    { to: join('css', 'numerals.css'), content: readFileSync(join(dir, 'Numerals.css'), 'utf8') },
    { to: join('css', 'prelude.css'), content: readFileSync(join(dir, 'Prelude.generated.css'), 'utf8') },
    ...named,
    { to: join('css', 'components.css'), content: `${SHEET_BANNERS.components}\n${barrel}\n` },
  ];
}

export function copyCli(dir, root = repoRoot) {
  const from = join(root, 'scripts', 'generate', 'core', 'arena-theme');
  const written = copyTree(from, dir, 'bin');
  if (written.length === 0) throw new Error('package-assembly: copied 0 CLI files; the arena-theme directory moved');
  return written.map((p) => relative(dir, p));
}

export function version(root = repoRoot) {
  return JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version;
}

export function baseManifest(root = repoRoot) {
  const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
  return {
    version: plugin.version,
    license: plugin.license,
    homepage: plugin.homepage,
    repository: { type: 'git', url: `git+${plugin.repository}.git` },
    author: plugin.author,
    publishConfig: { access: 'public' },
    bin: { 'arena-theme': './bin/arena-theme.mjs' },
    engines: { node: '>=20' },
  };
}

export function report(name, dir, files) {
  const bytes = files.reduce((total, f) => total + (existsSync(f) ? statSync(f).size : 0), 0);
  return `${name}: ${files.length} file(s), ${(bytes / 1024).toFixed(0)} KiB, in ${relative(repoRoot, dir)}`;
}
