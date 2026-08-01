/* Every framework layer stands on contracts/ alone. A file under frameworks/<A> may not
 * name layer B nor any of B's source files, and the one edge that survives is angular
 * consuming tailwind's manifests -- ALLOWED carries it. Detection is textual as well as by
 * import, because the coupling this gate exists to kill was almost entirely prose: an import
 * graph was already clean while 88 sentences made one layer normative for another. A token
 * is matched case-sensitively so a gate or script name (check:angular, test:react,
 * build:tailwind) is not mistaken for a citation of the layer itself. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, extname, dirname, resolve } from 'node:path';
import { LAYERS } from '../../lib/arena/layers.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

export const LAYER_TOKENS = {
  react: [
    ['React', /\bReact\b/],
    ['.jsx', /\.jsx\b/],
    ['frameworks/react', /frameworks\/react\b/],
    ['UseDialogModal', /\bUseDialogModal\b/],
  ],
  angular: [
    ['Angular', /\bAngular\b/],
    ['frameworks/angular', /frameworks\/angular\b/],
    ['FocusTrap', /\bFocusTrap\b/],
    ['TestbedEnv', /\bTestbedEnv\b/],
    ['.variants.ts', /\.variants\.ts\b/],
  ],
  tailwind: [
    ['Tailwind', /\bTailwind\b/],
    ['frameworks/tailwind', /frameworks\/tailwind\b/],
    ['.manifest.json', /\.manifest\.json\b/],
  ],
};

export const FORBIDDEN = {
  react: ['angular', 'tailwind'],
  angular: ['react'],
  tailwind: ['react', 'angular'],
};

export const ALLOWED = new Map([
  ['angular -> tailwind',
   'An Angular primitive is styled by the shared Tailwind recipe: its <Component>.variants.ts '
   + 'imports the generated <Component>.manifest.generated beside the manifest, through the '
   + 'configured tv in frameworks/tailwind/Tv.ts. It is the one edge between two framework '
   + 'layers, it is a build dependency rather than a prose one, and the manifest is data -- '
   + 'slots, variants and class strings -- so nothing about Angular reaches back into Tailwind.'],
]);

export const ALLOWED_SPECIFIERS = [
  /^frameworks\/tailwind\/components\/[a-z-]+\/[a-z-]+\/[A-Za-z]+\.manifest\.generated$/,
  /^frameworks\/tailwind\/Tv$/,
];

export const EXEMPT = new Map([]);

const SCAN_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json', '.css', '.html', '.md']);
export const MODULE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', 'vendor', 'build', 'dist']);

export function* layerFiles(layerDir) {
  for (const entry of readdirSync(layerDir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(layerDir, entry);
    if (statSync(path).isDirectory()) { yield* layerFiles(path); continue; }
    if (!SCAN_EXT.has(extname(entry))) continue;
    if (entry.includes('.generated.')) continue;
    yield path;
  }
}

export function foreignTokens(layer) {
  return FORBIDDEN[layer].flatMap((other) => LAYER_TOKENS[other].map(([token, re]) => ({ other, token, re })));
}

export function textualHits(text, tokens) {
  const hits = [];
  const lines = text.split('\n');
  for (const [index, line] of lines.entries())
    for (const { other, token, re } of tokens)
      if (re.test(line)) hits.push({ other, token, line: index + 1, text: line.trim() });
  return hits;
}

const SPECIFIER = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

export function escapingSpecifiers(text, filePath, layer) {
  const foreign = FORBIDDEN[layer].concat(layer === 'angular' ? ['tailwind'] : []);
  const found = [];
  for (const m of text.matchAll(SPECIFIER)) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue;
    const target = relative(root, resolve(dirname(filePath), spec)).replace(/\\/g, '/');
    if (!foreign.some((other) => target.startsWith(`frameworks/${other}/`))) continue;
    found.push(target);
  }
  return found;
}

export function isAllowedSpecifier(specifier) {
  return ALLOWED_SPECIFIERS.some((re) => re.test(specifier));
}

export function collect() {
  const findings = [];
  const matchedKeys = [];
  let scanned = 0;

  for (const layer of LAYERS) {
    const layerDir = join(root, 'frameworks', layer);
    const tokens = foreignTokens(layer);
    for (const path of layerFiles(layerDir)) {
      const rel = relative(root, path).replace(/\\/g, '/');
      const text = readFileSync(path, 'utf8');
      scanned += 1;

      if (MODULE_EXT.has(extname(path))) {
        for (const spec of escapingSpecifiers(text, path, layer)) {
          if (isAllowedSpecifier(spec)) continue;
          findings.push({ kind: 'import', layer, file: rel, detail: spec });
        }
      }

      for (const hit of textualHits(text, tokens)) {
        const key = `${rel}:${hit.token}`;
        matchedKeys.push(key);
        if (EXEMPT.has(key)) continue;
        findings.push({ kind: 'text', layer, file: rel, detail: hit.token, other: hit.other, line: hit.line, text: hit.text });
      }
    }
  }
  return { findings, matchedKeys, scanned };
}

export function staleExemptions(matchedKeys) {
  const matched = new Set(matchedKeys);
  return [...EXEMPT.keys()].filter((k) => !matched.has(k));
}

export function staleLayerTokens(base = root) {
  const stale = [];
  for (const [layer, tokens] of Object.entries(LAYER_TOKENS)) {
    const unseen = new Map(tokens);
    for (const path of layerFiles(join(base, 'frameworks', layer))) {
      if (!unseen.size) break;
      const text = readFileSync(path, 'utf8');
      for (const [token, re] of [...unseen]) if (re.test(text)) unseen.delete(token);
    }
    for (const token of unseen.keys())
      stale.push(`${layer}: "${token}" matches nothing under frameworks/${layer}/, so it identifies `
        + 'that layer nowhere and every other layer may now cite it freely');
  }
  return stale;
}

function main() {
  const { findings, matchedKeys, scanned } = collect();
  const stale = staleExemptions(matchedKeys);
  const staleTokens = staleLayerTokens();
  let failed = false;

  if (staleTokens.length) {
    failed = true;
    console.error(`check-layer-independence: ${staleTokens.length} stale LAYER_TOKENS entr`
      + `${staleTokens.length === 1 ? 'y' : 'ies'}\n`);
    for (const entry of staleTokens) console.error(`  ${entry}`);
    console.error('');
  }

  if (findings.length) {
    failed = true;
    const byFile = new Map();
    for (const f of findings) {
      if (!byFile.has(f.file)) byFile.set(f.file, []);
      byFile.get(f.file).push(f);
    }
    console.error(`check-layer-independence: ${findings.length} cross-layer reference(s) in ${byFile.size} file(s)\n`);
    for (const [file, hits] of [...byFile].sort()) {
      console.error(`  ${file}`);
      for (const h of hits) {
        if (h.kind === 'import') console.error(`    imports ${h.detail}, which is outside this layer`);
        else console.error(`    ${h.line}: names ${h.other} ("${h.detail}") -- ${h.text.slice(0, 96)}`);
      }
    }
    console.error('\nA layer stands on contracts/ alone. State the fact neutrally in the contract both');
    console.error('layers already obey, and cite that instead. The one authorised edge is on the record:');
    for (const [edge, reason] of ALLOWED) console.error(`  ${edge} -- ${reason}`);
  }

  if (stale.length) {
    if (failed) console.error('');
    failed = true;
    console.error(`check-layer-independence: ${stale.length} stale EXEMPT entr${stale.length === 1 ? 'y' : 'ies'}\n`);
    for (const key of stale) console.error(`  ${key} -- ${EXEMPT.get(key)}`);
  }

  if (failed) process.exit(1);
  console.log(`check-layer-independence: clean -- ${scanned} file(s) scanned, ${EXEMPT.size} exempted on the record`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
