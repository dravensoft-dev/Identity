import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, join, relative } from 'node:path';
import { manifestFiles } from '../../lib/tailwind/tailwind-compile.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const COMPONENTS_DIR = join(repoRoot, 'frameworks/tailwind/components');
const REACT_COMPONENTS_DIR = join(repoRoot, 'frameworks/react/components');

export const SOURCE_OVERRIDES = new Map([
  ['Tag', ['frameworks/angular/components/display/tag/Tag.ts']],

  ['Table', [
    'frameworks/react/components/display/table/Table.jsx',
    'frameworks/react/components/display/table-row/TableRow.jsx',
  ]],

  ['SideNav', [
    'frameworks/react/components/navigation/side-nav/SideNav.jsx',
    'frameworks/react/components/navigation/side-nav-item/SideNavItem.jsx',
    'frameworks/react/components/navigation/side-nav-section/SideNavSection.jsx',
    'frameworks/react/components/navigation/side-nav-collapsible/SideNavCollapsible.jsx',
  ]],

  ['Tabs', ['frameworks/react/components/navigation/tabs/Tabs.jsx',
            'frameworks/react/components/navigation/tab/Tab.jsx']],

  ['Calendar', [
    'frameworks/react/components/display/calendar/Calendar.jsx',
    'frameworks/react/components/display/calendar-event/CalendarEvent.jsx',
  ]],
]);

export const EXEMPT = new Map([
  ['ConfirmDialog:confirm:hover',
   "ConfirmDialog.jsx renders its confirm/cancel actions as React's own <Button> " +
   '(imported from forms/Button.jsx), so the hover comes from Button.jsx\'s own ' +
   'useState hover tracking, not from anything ConfirmDialog.jsx implements itself. ' +
   'A single-file scan of ConfirmDialog.jsx alone cannot see across that composition.'],
  ['ErrorState:retry:hover',
   "ErrorState.jsx renders its retry action as React's own <Button> (imported from " +
   "forms/Button.jsx), so the hover comes from Button.jsx's own useState hover tracking, " +
   'not from anything ErrorState.jsx implements itself. A single-file scan of ' +
   'ErrorState.jsx alone cannot see across that composition -- the same shape ' +
   "ConfirmDialog:confirm:hover above is exempt for."],
]);

const FAMILY_PATTERNS = {
  hover: /(?:^|:)hover:/,
  focus: /(?:^|:)focus(?:-visible|-within)?:/,
};

const IMPLEMENTS_PATTERNS = {
  hover: /\bonMouseEnter\b|\bonMouseLeave\b|:hover\b|\(mouseenter\)|\(mouseleave\)/,
  focus: /\bonFocus\b|\bonBlur\b|:focus(?:-visible|-within)?\b|\(focus\)|\(blur\)/,
};

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

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { yield* walk(p); continue; }
    yield p;
  }
}

export function findReactSource(name) {
  const target = `${name}.jsx`;
  for (const file of walk(REACT_COMPONENTS_DIR))
    if (file.endsWith(`/${target}`) || file === join(REACT_COMPONENTS_DIR, target))
      return relative(repoRoot, file);
  return null;
}

export function resolveSources(name) {
  if (SOURCE_OVERRIDES.has(name)) return SOURCE_OVERRIDES.get(name);
  const found = findReactSource(name);
  if (!found) throw new Error(
    `check-manifest-states: no React source found for manifest component "${name}" ` +
    `(looked for ${name}.jsx under frameworks/react/components/) and no SOURCE_OVERRIDES entry names one -- ` +
    'add one or the other.'
  );
  return [found];
}

export function staleExemptions(matchedKeys) {
  const matched = new Set(matchedKeys);
  return [...EXEMPT.keys()].filter((k) => !matched.has(k));
}

export function evaluateManifest(manifest, sourceText, sources) {
  const name = manifest.component;
  const capability = sourceImplements(sourceText);
  const findings = [];
  const matchedKeys = [];
  let sites = 0;
  for (const [slot, classList] of classStringsBySlot(manifest)) {
    const families = new Set();
    for (const cls of classList) for (const f of stateFamilies(cls)) families.add(f);
    for (const family of families) {
      const key = `${name}:${slot}:${family}`;
      sites += 1;

      if (capability[family]) continue;
      matchedKeys.push(key);
      if (EXEMPT.has(key)) continue;
      findings.push({ component: name, slot, family, sources });
    }
  }
  return { findings, matchedKeys, sites };
}

export function collect() {
  const findings = [];
  const matchedKeys = [];
  let sites = 0;
  const manifestFiles_ = manifestFiles(COMPONENTS_DIR);
  for (const p of manifestFiles_) {
    const manifest = JSON.parse(readFileSync(p, 'utf8'));
    const sources = resolveSources(basename(p).replace(/\.manifest\.json$/, ''));
    const sourceText = sources.map((s) => readFileSync(join(repoRoot, s), 'utf8')).join('\n');
    const result = evaluateManifest(manifest, sourceText, sources);
    findings.push(...result.findings);
    matchedKeys.push(...result.matchedKeys);
    sites += result.sites;
  }
  return { findings, matchedKeys, sites };
}

function main() {
  const { findings, matchedKeys, sites } = collect();
  const stale = staleExemptions(matchedKeys);
  let failed = false;

  if (findings.length) {
    failed = true;
    console.error(`check-manifest-states: ${findings.length} invented state modifier(s)\n`);
    for (const f of findings)
      console.error(`  ${f.component}:${f.slot} carries a ${f.family}: modifier, but ${f.sources.join(', ')} implements no ${f.family} anywhere`);
    console.error('\nEither the source needs the affordance (add it there first), or the');
    console.error('manifest is wrong and the modifier should be removed. See frameworks/tailwind/README.md, "P1 -- invented states".');
  }

  if (stale.length) {
    if (failed) console.error('');
    failed = true;
    console.error(`check-manifest-states: ${stale.length} stale EXEMPT entr${stale.length === 1 ? 'y' : 'ies'} -- named a component/slot/family that no longer carries that state\n`);
    for (const key of stale) console.error(`  ${key} -- ${EXEMPT.get(key)}`);
    console.error('\nThe manifest slot lost the state modifier, or the source gained the affordance');
    console.error('itself. Remove the entry, or re-key it to match the current manifest.');
  }

  if (failed) process.exit(1);
  console.log(`check-manifest-states: clean -- ${sites} state-modifier site(s) checked, ${EXEMPT.size} exempted on the record`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
