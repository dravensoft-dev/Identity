/* A hover or focus affordance is a decision about the component, so the authority is
 * contracts/api/components/<Name>.json's `affordances` and no layer's source. Both halves run
 * one way only: a state modifier or an implementation the contract does not declare is
 * invented, while a declared affordance a layer does not implement may be composition.
 * Angular is not checkable here and that is structural, not an omission -- it realises an
 * affordance by rendering the manifest's own class, so asking it would be asking the manifest.
 * MANIFEST_COVERS exists because a manifest mirrors a rendered SURFACE: a compound family
 * draws several contracted components, and so does a component that composes one. */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, join } from 'node:path';
import { manifestFiles } from '../../lib/tailwind/tailwind-compile.mjs';
import { kebab } from '../../lib/arena/layers.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const COMPONENTS_DIR = join(repoRoot, 'frameworks/tailwind/components');
const CONTRACTS_DIR = join(repoRoot, 'contracts/api/components');
const REACT_COMPONENTS_DIR = join(repoRoot, 'frameworks/react/components');

export const MANIFEST_COVERS = new Map([
  ['Table', {
    covers: ['Table', 'TableRow', 'TableCell'],
    reason: 'One manifest draws the whole grid: the header and the empty state are Table\'s, the '
      + 'interactive row is TableRow\'s and the cells are TableCell\'s.',
  }],
  ['Tabs', {
    covers: ['Tabs', 'Tab'],
    reason: 'The tablist and its tab buttons are Tabs\'; the panel is Tab\'s. The roving stop that '
      + 'carries the focus ring sits on a tab, which is the member Tab contracts.',
  }],
  ['BottomNav', {
    covers: ['BottomNav', 'BottomNavItem'],
    reason: 'One manifest draws the whole bar -- the fixed row is BottomNav\'s and the equal '
      + 'column, its glyph, its label and its badge are BottomNavItem\'s. The item carries no '
      + 'manifest of its own because it has no surface of its own: it IS a column of the bar.',
  }],
  ['SideNav', {
    covers: ['SideNav', 'SideNavItem', 'SideNavSection', 'SideNavCollapsible'],
    reason: 'The family nests to any depth and one manifest holds every level of it -- the rail, a '
      + 'destination row, a labelled group and a disclosure.',
  }],
  ['Calendar', {
    covers: ['Calendar', 'CalendarEvent'],
    reason: 'The grid and its chips are one surface: a chip is positioned as a share of the grid, '
      + 'so its slots cannot live in a manifest of their own.',
  }],
  ['ConfirmDialog', {
    covers: ['ConfirmDialog', 'Button'],
    reason: 'The dialog draws the confirm action itself, because that action carries Arena\'s one '
      + 'filled danger surface and a Button forwards no style. The cancel action is still an Arena '
      + 'Button, and a manifest has no composition, so it types that button out as its own slot and '
      + 'needs Button\'s affordance.',
  }],
  ['ErrorState', {
    covers: ['ErrorState', 'Button'],
    reason: 'The retry action is an Arena Button, typed out as a slot for the same reason '
      + 'ConfirmDialog\'s is.',
  }],
]);

export const EXEMPT = new Map([]);

const FAMILY_PATTERNS = {
  hover: /(?:^|:)hover:/,
  focus: /(?:^|:)focus(?:-visible|-within)?:/,
};

const IMPLEMENTS_PATTERNS = {
  hover: /\bonMouseEnter\b|\bonMouseLeave\b|:hover\b|\(mouseenter\)|\(mouseleave\)/,
  focus: /\bonFocus\b|\bonBlur\b|:focus(?:-visible|-within)?\b|\(focus\)|\(blur\)/,
};

export const FAMILIES = Object.keys(FAMILY_PATTERNS);

export function stateFamilies(classString) {
  const families = new Set();
  for (const token of classString.split(/\s+/).filter(Boolean))
    for (const [family, re] of Object.entries(FAMILY_PATTERNS))
      if (re.test(token)) families.add(family);
  return families;
}

export function sourceImplements(sourceText) {
  return {
    hover: IMPLEMENTS_PATTERNS.hover.test(sourceText),
    focus: IMPLEMENTS_PATTERNS.focus.test(sourceText),
  };
}

export function classStringsBySlot(manifest) {
  const bySlot = new Map();
  const add = (slot, cls) => {
    if (typeof cls !== 'string') return;
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot).push(cls);
  };
  for (const [slot, cls] of Object.entries(manifest.slots || {})) add(slot, cls);
  for (const variantGroup of Object.values(manifest.variants || {}))
    for (const branch of Object.values(variantGroup))
      for (const [slot, cls] of Object.entries(branch || {})) add(slot, cls);
  return bySlot;
}

export function coveredContracts(name) {
  return MANIFEST_COVERS.get(name)?.covers ?? [name];
}

export function readContract(name) {
  const path = join(CONTRACTS_DIR, `${name}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function declaredAffordances(contract, where) {
  if (!Array.isArray(contract.affordances)) {
    throw new Error(
      `check-manifest-states: ${where} declares no \`affordances\` array. Every contract states one, `
      + 'and an empty array is how a component says it presents no hover or focus state.',
    );
  }
  const unknown = contract.affordances.filter((a) => !FAMILIES.includes(a));
  if (unknown.length) {
    throw new Error(`check-manifest-states: ${where} declares unknown affordance(s) ${unknown.join(', ')}`);
  }
  return new Set(contract.affordances);
}

export function affordancesFor(names) {
  const union = new Set();
  for (const name of names) {
    const contract = readContract(name);
    if (!contract) continue;
    for (const a of declaredAffordances(contract, `contracts/api/components/${name}.json`)) union.add(a);
  }
  return union;
}

export function manifestProblems(manifest, declared) {
  const findings = [];
  const matchedKeys = [];
  let sites = 0;
  const name = manifest.component;
  for (const [slot, classList] of classStringsBySlot(manifest)) {
    const families = new Set();
    for (const cls of classList) for (const f of stateFamilies(cls)) families.add(f);
    for (const family of families) {
      sites += 1;
      if (declared.has(family)) continue;
      const key = `${name}:${slot}:${family}`;
      matchedKeys.push(key);
      if (EXEMPT.has(key)) continue;
      findings.push({ half: 'manifest', component: name, slot, family });
    }
  }
  return { findings, matchedKeys, sites };
}

export const SOURCE_EXTENSIONS = ['.tsx', '.jsx'];

export function reactSourceFor(name, category) {
  const dir = join(REACT_COMPONENTS_DIR, category, kebab(name));
  for (const ext of SOURCE_EXTENSIONS) {
    const path = join(dir, `${name}${ext}`);
    if (existsSync(path)) return path;
  }
  return null;
}

export function missingReactSource(name, category) {
  const dir = join(REACT_COMPONENTS_DIR, category, kebab(name));
  if (!existsSync(dir) || reactSourceFor(name, category)) return null;
  return `${name}: frameworks/react/components/${category}/${kebab(name)}/ holds no ${name}.tsx and `
    + `no ${name}.jsx, so its affordances were never read and this half reported clean over nothing`;
}

export function zeroReactSourceProblems(count) {
  if (count > 0) return [];
  return ['read 0 React sources; the react half of this gate checked nothing, which is a failure '
    + 'rather than a clean pass'];
}

export function reactProblems(name, category) {
  const path = reactSourceFor(name, category);
  if (!path) return { findings: [], sites: 0 };
  const contract = readContract(name);
  if (!contract) return { findings: [], sites: 0 };
  const declared = declaredAffordances(contract, `contracts/api/components/${name}.json`);
  const capability = sourceImplements(readFileSync(path, 'utf8'));
  const findings = [];
  let sites = 0;
  for (const family of FAMILIES) {
    if (!capability[family]) continue;
    sites += 1;
    if (declared.has(family)) continue;
    findings.push({ half: 'react', component: name, family });
  }
  return { findings, sites };
}

export function collect() {
  const findings = [];
  const matchedKeys = [];
  let sites = 0;

  for (const p of manifestFiles(COMPONENTS_DIR)) {
    const manifest = JSON.parse(readFileSync(p, 'utf8'));
    const name = basename(p).replace(/\.manifest\.json$/, '');
    const result = manifestProblems(manifest, affordancesFor(coveredContracts(name)));
    findings.push(...result.findings);
    matchedKeys.push(...result.matchedKeys);
    sites += result.sites;
  }

  const categories = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));
  const missingSources = [];
  let sourcesRead = 0;
  for (const [category, names] of Object.entries(categories))
    for (const name of names) {
      const missing = missingReactSource(name, category);
      if (missing) missingSources.push(missing);
      if (reactSourceFor(name, category)) sourcesRead += 1;
      const result = reactProblems(name, category);
      findings.push(...result.findings);
      sites += result.sites;
    }

  return {
    findings,
    matchedKeys,
    sites,
    missingSources,
    zeroSources: zeroReactSourceProblems(sourcesRead),
  };
}

export function staleExemptions(matchedKeys) {
  const matched = new Set(matchedKeys);
  return [...EXEMPT.keys()].filter((k) => !matched.has(k));
}

export function staleCovers() {
  return [...MANIFEST_COVERS].flatMap(([name, { covers }]) => {
    const missing = covers.filter((c) => !readContract(c));
    return missing.length ? [`${name} -> ${missing.join(', ')}`] : [];
  });
}

function main() {
  const { findings, matchedKeys, sites, missingSources, zeroSources } = collect();
  const stale = staleExemptions(matchedKeys);
  const staleCoverage = staleCovers();
  let failed = false;

  if (missingSources.length || zeroSources.length) {
    failed = true;
    for (const problem of [...zeroSources, ...missingSources])
      console.error(`check-manifest-states: ${problem}`);
    console.error('');
  }

  if (findings.length) {
    failed = true;
    console.error(`check-manifest-states: ${findings.length} undeclared affordance(s)\n`);
    for (const f of findings) {
      if (f.half === 'manifest') {
        console.error(`  ${f.component}:${f.slot} carries a ${f.family}: modifier, and no contract this `
          + `manifest covers (${coveredContracts(f.component).join(', ')}) declares a ${f.family} affordance`);
      } else {
        console.error(`  ${f.component} implements ${f.family}, and contracts/api/components/${f.component}.json `
          + `declares no ${f.family} affordance`);
      }
    }
    console.error('\nEither the component genuinely presents the affordance -- declare it in the contract,');
    console.error('which licenses every layer at once -- or it does not and the state is invented.');
    console.error('See frameworks/tailwind/README.md, "P1 -- invented states".');
  }

  if (stale.length || staleCoverage.length) {
    if (failed) console.error('');
    failed = true;
    for (const key of stale) console.error(`  stale EXEMPT: ${key} -- ${EXEMPT.get(key)}`);
    for (const entry of staleCoverage) console.error(`  stale MANIFEST_COVERS: ${entry} names no contract`);
  }

  if (failed) process.exit(1);
  console.log(`check-manifest-states: clean -- ${sites} affordance site(s) checked against the contracts, `
    + `${EXEMPT.size} exempted on the record`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
