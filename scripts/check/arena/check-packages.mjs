/* Four claims. First, that the CLI shipped inside both packages emits what Style Dictionary
 * emits: a second emitter exists, so something has to hold the two together. Second, when
 * dist/ has been assembled, that each package is registry-standard: the version comes from
 * plugin.json, every exports target resolves to a file that is there and every wildcard one
 * matches at least one, the entry declaration is advertised at the root, and no peer leaked into
 * dependencies. Third, that the stylesheets resolve, because a sheet that imports 43 files that
 * are not there passes the second claim and fails in the consumer's bundler. Fourth, that the
 * component map is there and reaches every sheet both ways: it is all that stands between
 * "components": "auto" and a subset resolved from nothing, which is every screen unstyled with
 * the build green. dist/ is git-ignored, so all but the first are skipped on a fresh clone. */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, basename, sep } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { parseDecls } from '../../lib/arena/css-decls.mjs';
import { arenaConfig } from '../../lib/core/arena-config.mjs';
import { themeCss } from '../../generate/core/arena-to-prod/theme-css.mjs';
import { MAP_FILE } from '../../lib/arena/component-map.mjs';

export const PACKAGES = [
  { layer: 'react', name: '@dravensoft/arena-react' },
  { layer: 'angular', name: '@dravensoft/arena-angular' },
];

export const GENERATED_PALETTE = 'contracts/design-generated/palette.generated.css';

export const distDir = (layer, base = root) => join(base, 'frameworks', layer, 'dist');

const isColour = (name) => name.startsWith('color-');

export function stripAtStatements(css) {
  return css.replace(/^[ \t]*@[a-z-]+[^{}\n]*;[ \t]*$/gim, '');
}

export function paletteEquivalenceProblems(generatedCss, cliCss) {
  const expected = parseDecls(stripAtStatements(generatedCss));
  const actual = parseDecls(stripAtStatements(cliCss));
  const problems = [];
  let compared = 0;

  for (const [selector, decls] of expected) {
    const mine = actual.get(selector);
    if (!mine) {
      problems.push(`${GENERATED_PALETTE} declares ${selector} and arena-to-prod emits no such block`);
      continue;
    }
    for (const [name, value] of decls) {
      if (!isColour(name)) continue;
      compared += 1;
      if (mine.get(name) !== value) {
        problems.push(`${selector} --${name}: Style Dictionary says ${value}, arena-to-prod says ${mine.get(name) ?? '(nothing)'}`);
      }
    }
    for (const name of mine.keys()) {
      if (isColour(name) && !decls.has(name)) problems.push(`${selector} --${name}: arena-to-prod emits it and Style Dictionary does not`);
    }
  }

  if (compared === 0) {
    problems.push(`compared 0 declarations against ${GENERATED_PALETTE}; a zero-result comparison is a failure, not a pass`);
  }
  return { problems, compared };
}

export function manifestProblems(pkg, manifest, version) {
  const problems = [];
  const at = pkg.name;

  if (manifest.name !== pkg.name) problems.push(`${at}: manifest names itself ${manifest.name}`);
  if (manifest.version !== version) {
    problems.push(`${at}: version ${manifest.version}, and .claude-plugin/plugin.json says ${version}`);
  }
  if (manifest.private) problems.push(`${at}: private, so it can never be published`);
  if (manifest.scripts?.postinstall || manifest.scripts?.install || manifest.scripts?.preinstall) {
    problems.push(`${at}: declares an install script, which Bun and npm run differently and consumers disable`);
  }

  for (const name of Object.keys(manifest.dependencies ?? {})) {
    if (Object.hasOwn(manifest.peerDependencies ?? {}, name)) {
      problems.push(`${at}: ${name} is both a dependency and a peer`);
    }
    if (name.startsWith('@dravensoft/')) problems.push(`${at}: ${name} is a dependency; an Arena package is always a peer`);
    if (name === '@phosphor-icons/web') problems.push(`${at}: Phosphor is the consumer's to install, never a dependency`);
  }
  if (!Object.hasOwn(manifest.peerDependencies ?? {}, '@phosphor-icons/web')) {
    problems.push(`${at}: no peer on @phosphor-icons/web, and every component renders ph-* classes`);
  }
  return problems;
}

function exportTargets(exports) {
  const out = [];
  const walk = (value) => {
    if (typeof value === 'string') { out.push(value); return; }
    if (value && typeof value === 'object') for (const v of Object.values(value)) walk(v);
  };
  walk(exports);
  return out;
}

export function globMatches(target, dir) {
  const rel = target.replace(/^\.\//, '');
  const pattern = new RegExp(`^${rel.split('*').map((p) => p.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('[^/]*')}$`);
  const found = [];
  const walk = (at, prefix) => {
    if (!existsSync(at)) return;
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(at, entry.name), path);
      else if (pattern.test(path)) found.push(path);
    }
  };
  walk(dir, '');
  return found;
}

export function exportProblems(pkg, manifest, dir) {
  const problems = [];
  const targets = exportTargets(manifest.exports ?? {});
  if (targets.length === 0) problems.push(`${pkg.name}: no exports target resolves to a file, so the package exposes nothing`);
  for (const target of targets.filter((t) => !t.includes('*'))) {
    if (!existsSync(join(dir, target))) problems.push(`${pkg.name}: exports ${target}, which was never emitted`);
  }
  for (const target of targets.filter((t) => t.includes('*'))) {
    if (globMatches(target, dir).length === 0) {
      problems.push(`${pkg.name}: exports ${target}, which matches nothing that was emitted, so the subpath `
        + 'resolves to a module error for every consumer who imports it');
    }
  }
  const types = manifest.types ?? manifest.typings;
  if (!types) {
    problems.push(`${pkg.name}: no types and no typings at the root, so npm reads the package as untyped and a consumer on moduleResolution: node finds no declarations`);
  } else if (!existsSync(join(dir, types))) {
    problems.push(`${pkg.name}: types ${types}, which was never emitted`);
  }
  for (const [field, value] of Object.entries(manifest.bin ?? {})) {
    if (!existsSync(join(dir, value))) problems.push(`${pkg.name}: bin ${field} points at ${value}, which was never emitted`);
  }
  if (!existsSync(join(dir, 'README.md'))) problems.push(`${pkg.name}: no README.md, which is the page npm shows`);
  return problems;
}

export function componentMapProblems(pkg, dir) {
  const at = join(dir, MAP_FILE);
  if (!existsSync(at)) {
    return [`${pkg.name}: no ${MAP_FILE}, so "components": "auto" has nothing to resolve a template against`];
  }
  let map;
  try {
    map = JSON.parse(readFileSync(at, 'utf8'));
  } catch (error) {
    return [`${pkg.name}: ${MAP_FILE} does not parse: ${error.message}`];
  }
  const sheets = existsSync(join(dir, 'css', 'components'))
    ? readdirSync(join(dir, 'css', 'components')).filter((n) => n.endsWith('.css')).map((n) => basename(n, '.css'))
    : [];
  const claimed = new Set(Object.values(map.draws ?? {}).filter(Boolean));
  const problems = [];
  if (!map.match || claimed.size === 0) {
    problems.push(`${pkg.name}: ${MAP_FILE} names no component sheet, so auto would resolve every project to nothing`);
  }
  for (const sheet of [...claimed].sort()) {
    if (!sheets.includes(sheet)) problems.push(`${pkg.name}: ${MAP_FILE} names ${sheet}, and no such sheet was emitted`);
  }
  for (const sheet of sheets.filter((s) => !claimed.has(s)).sort()) {
    problems.push(`${pkg.name}: ${MAP_FILE} reaches no key for ${sheet}, so auto can never put it in a subset`);
  }
  return problems;
}

const RELATIVE_IMPORT = /@import\s+(?:url\(\s*)?['"](\.[^'"]*)['"]/g;

export function importsIn(css) {
  return [...css.matchAll(RELATIVE_IMPORT)].map((match) => match[1]);
}

export function styleProblems(pkg, dir) {
  const problems = [];
  const seen = new Set();
  const queue = ['arena.css'];
  let components = 0;

  while (queue.length) {
    const from = queue.shift();
    if (seen.has(from)) continue;
    seen.add(from);
    if (from.startsWith('css/components/')) components += 1;

    const full = join(dir, from);
    if (!existsSync(full)) continue;
    for (const specifier of importsIn(readFileSync(full, 'utf8'))) {
      const target = join(dirname(from), specifier).split(sep).join('/');
      if (existsSync(join(dir, target))) queue.push(target);
      else problems.push(`${pkg.name}: ${from} imports ${specifier}, which was never emitted`);
    }
  }

  if (components === 0) {
    problems.push(`${pkg.name}: arena.css reaches no component stylesheet, so every component it ships `
      + 'renders unstyled; a walk that found nothing is a failure, not a clean pass');
  }
  return { problems, walked: seen.size };
}

export function collect(base = root) {
  const version = JSON.parse(readFileSync(join(base, '.claude-plugin/plugin.json'), 'utf8')).version;
  const problems = [];

  const cli = themeCss(arenaConfig(base), { importHeader: false });
  const generated = readFileSync(join(base, GENERATED_PALETTE), 'utf8');
  const equivalence = paletteEquivalenceProblems(generated, cli);
  problems.push(...equivalence.problems);

  const assembled = [];
  for (const pkg of PACKAGES) {
    const dir = distDir(pkg.layer, base);
    const manifestPath = join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    assembled.push(pkg.name);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    problems.push(...manifestProblems(pkg, manifest, version));
    problems.push(...exportProblems(pkg, manifest, dir));
    problems.push(...componentMapProblems(pkg, dir));
    problems.push(...styleProblems(pkg, dir).problems);
  }

  return { problems, compared: equivalence.compared, assembled, version };
}

function main() {
  const { problems, compared, assembled, version } = collect();
  for (const problem of problems) console.error(`check-packages: ${problem}`);

  if (problems.length) {
    console.error(`\ncheck-packages: ${problems.length} problem(s)`);
    process.exit(1);
  }

  const built = assembled.length
    ? `${assembled.length} package(s) assembled at ${version}: ${assembled.join(', ')}`
    : 'no package assembled; run bun run build:packages to check the manifests too';
  console.log(`check-packages: arena-to-prod matches ${GENERATED_PALETTE} across ${compared} declaration(s); ${built}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
