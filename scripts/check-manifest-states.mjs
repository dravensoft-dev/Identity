/* Fails when a Tailwind manifest under frameworks/tailwind/components/ carries a
 * hover:/focus:-family Tailwind state modifier that the component it mirrors
 * implements nowhere -- no `onMouseEnter`/`onMouseLeave`, no `onFocus`/`onBlur`,
 * no `useState` hover/focus tracking, no `:hover`/`:focus` in an injected style
 * string (or the Angular event-binding equivalents). This is the machine form
 * of frameworks/tailwind/README.md's P1 rule ("invented states"): a manifest
 * authored by copying a neighbouring manifest, rather than by reading the
 * component's own source, is how a hover or focus modifier the source never
 * implements enters this layer and survives -- undetected, because no other
 * gate compares a manifest against the component it mirrors (see CLAUDE.md).
 *
 * It found this shape twice on this branch: `Tabs`' `selected: false` branch
 * once carried a `hover:` copied from `SegmentedControl`'s near-identical
 * variant, and `Pagination.manifest.json` shipped three (`nav`/`pageOther`'s
 * `hover:bg-base-200`, `pageCurrent`'s `hover:shadow-2`) one commit after the
 * rule was written down in prose for the first defect. Prose did not stop a
 * second occurrence; this gate is the mechanization.
 *
 * SCOPE: states only. This does not attempt the general "does this manifest
 * still match the component it mirrors" question -- CLAUDE.md is explicit that
 * nothing closes that -- it is narrowly the hover/focus-invention shape both
 * defects share. A crude, whole-file text scan, on purpose: it answers "does
 * this file mention a hover/focus affordance anywhere", not "does this exact
 * slot's exact class have a corresponding handler on this exact element".
 *
 * MAPPING. Most manifests mirror a same-named React component 1:1
 * (`Pagination.manifest.json` <-> `Pagination.jsx`, found by a recursive
 * filename search under frameworks/react/components/). Two things do not
 * reduce to that search:
 *
 *   - SOURCE_OVERRIDES corrects a mapping the naive search gets wrong outright.
 *     `Tag.manifest.json` mirrors the Angular primitive `arena-tag`
 *     (frameworks/angular/primitives/tag/tag.ts), a different component from
 *     React's `Tag.jsx` -- CLAUDE.md says this explicitly. A same-name search
 *     would find `Tag.jsx` and silently check the wrong file.
 *
 *   - EXEMPT is for a specific slot's state family that a whole-file scan of
 *     the *correctly resolved* source still cannot verify, because the
 *     affordance is real but lives one level away from where this gate reads
 *     -- delegated to a different component the resolved file renders, or
 *     added deliberately on the Angular side as documented, undebated debt
 *     against React. Keyed `<Component>:<slot>:<family>`, same shape
 *     check-dimension-literals.mjs's EXEMPT uses, and for the same reason: a
 *     correct site can look exactly like a defect, so it is named rather than
 *     inferred. A stale entry -- one naming a component/slot/family that no
 *     longer carries that state family at all -- fails the gate, exactly as
 *     it does there.
 *
 *   bun scripts/check-manifest-states.mjs           -> exit 0 clean, 1 otherwise
 *   node scripts/check-manifest-states.mjs           -> same, runtime-portable
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const COMPONENTS_DIR = join(repoRoot, 'frameworks/tailwind/components');
const REACT_COMPONENTS_DIR = join(repoRoot, 'frameworks/react/components');

/** Component name -> source file(s), relative to repoRoot, to check INSTEAD
 *  of the default same-name search under frameworks/react/components/.
 *  A manifest not listed here resolves by filename search; see
 *  `resolveDefaultSource`. */
export const SOURCE_OVERRIDES = new Map([
  ['Tag', ['frameworks/angular/primitives/tag/tag.ts']],
]);

/** A specific `<Component>:<slot>:<family>` this crude, single-file scan
 *  cannot verify even against the *correctly resolved* source, with the
 *  reason it is legitimate anyway. Read the file before adding an entry --
 *  this map is for a real divergence between "the resolved source has no
 *  hover/focus text in it" and "the affordance genuinely does not exist",
 *  not a way to quiet a hit that is actually the invented-state bug this
 *  gate exists to catch. */
export const EXEMPT = new Map([
  ['ConfirmDialog:confirm:hover',
   "ConfirmDialog.jsx renders its confirm/cancel actions as React's own <Button> " +
   '(imported from forms/Button.jsx), so the hover comes from Button.jsx\'s own ' +
   'useState hover tracking, not from anything ConfirmDialog.jsx implements itself. ' +
   'A single-file scan of ConfirmDialog.jsx alone cannot see across that composition.'],
  ['ConfirmDialog:input:focus',
   "the require-text input's focus-visible ring is a documented, deliberate Angular " +
   "accessibility fix ConfirmDialog.jsx does not have -- see components-divergences.md, " +
   '"ConfirmDialog -- Angular is accessible, React is not yet". React implements no focus ' +
   'tracking on this input at all; the divergence is named there as open debt on the React ' +
   'layer, not an invented state on the Angular/Tailwind side.'],
  ['ErrorState:retry:hover',
   "ErrorState.jsx renders its retry action as React's own <Button> (imported from " +
   "forms/Button.jsx), so the hover comes from Button.jsx's own useState hover tracking, " +
   'not from anything ErrorState.jsx implements itself. A single-file scan of ' +
   'ErrorState.jsx alone cannot see across that composition -- the same shape ' +
   "ConfirmDialog:confirm:hover above is exempt for."],
]);

/** Tailwind state-modifier families this gate looks for, and the regex that
 *  finds a class token carrying one. `(?:^|:)` requires the family to start
 *  right after a `:` boundary (or the start of the token), so a stacked
 *  modifier (`sm:hover:...`) still matches and an unrelated class containing
 *  the substring elsewhere does not. */
const FAMILY_PATTERNS = {
  hover: /(?:^|:)hover:/,
  focus: /(?:^|:)focus(?:-visible|-within)?:/,
};

/** Text signals that a source file itself implements the given family,
 *  crude and intentionally so: a plain substring/regex search over the
 *  whole file, not an AST read of which element owns which handler. Angular
 *  event-binding syntax (`(mouseenter)`, `(focus)`, ...) is included for
 *  symmetry with SOURCE_OVERRIDES resolving to a `.ts` file. */
const IMPLEMENTS_PATTERNS = {
  hover: /\bonMouseEnter\b|\bonMouseLeave\b|:hover\b|\(mouseenter\)|\(mouseleave\)/,
  focus: /\bonFocus\b|\bonBlur\b|:focus(?:-visible|-within)?\b|\(focus\)|\(blur\)/,
};

/** @param {string} classString one slot's class-list value
 *  @returns {Set<'hover'|'focus'>} every state family a class token in it belongs to */
export function stateFamilies(classString) {
  const families = new Set();
  for (const token of classString.split(/\s+/).filter(Boolean))
    for (const [family, re] of Object.entries(FAMILY_PATTERNS))
      if (re.test(token)) families.add(family);
  return families;
}

/** @param {string} sourceText the concatenated text of a component's resolved source(s)
 *  @returns {{hover: boolean, focus: boolean}} which families the source implements anywhere */
export function sourceImplements(sourceText) {
  return {
    hover: IMPLEMENTS_PATTERNS.hover.test(sourceText),
    focus: IMPLEMENTS_PATTERNS.focus.test(sourceText),
  };
}

/** @param {object} manifest a parsed manifest.json
 *  @returns {Map<string, string[]>} slot name -> every class string that slot
 *  carries, from `slots` and from every `variants` branch. A slot named the
 *  same in `slots` and in a variant branch is the same slot -- both
 *  contribute to the same array. */
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

/** @param {string} name a manifest's `component` value, e.g. "Pagination"
 *  @returns {string|null} repoRoot-relative path to `<name>.jsx` found
 *  anywhere under frameworks/react/components/, or null if none exists. */
export function findReactSource(name) {
  const target = `${name}.jsx`;
  for (const file of walk(REACT_COMPONENTS_DIR))
    if (file.endsWith(`/${target}`) || file === join(REACT_COMPONENTS_DIR, target))
      return relative(repoRoot, file);
  return null;
}

/** @param {string} name a manifest's `component` value
 *  @returns {string[]} repoRoot-relative source path(s) whose text governs
 *  what states that component implements -- SOURCE_OVERRIDES if the name has
 *  one, else the default same-name search. Throws if neither resolves,
 *  since an unresolvable manifest is a gate bug (a new manifest with no
 *  matching component and no override), not a silent skip. */
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

/** @param {string[]} matchedKeys every `<Component>:<slot>:<family>` this run's
 *  scan actually produced as a candidate violation, before EXEMPT filtering
 *  @returns {string[]} EXEMPT keys that matched nothing this run */
export function staleExemptions(matchedKeys) {
  const matched = new Set(matchedKeys);
  return [...EXEMPT.keys()].filter((k) => !matched.has(k));
}

/** The gate's one decision, isolated so a test can call it directly on a
 *  fabricated manifest and a hand-written source string, rather than having
 *  to re-derive the verdict from the lower-level primitives itself.
 *  @param {object} manifest a parsed manifest.json (must carry `component`)
 *  @param {string} sourceText the concatenated text of its resolved source(s)
 *  @param {string[]} sources the resolved source path(s), for the finding's message
 *  @returns {{findings: {component: string, slot: string, family: string, sources: string[]}[], matchedKeys: string[]}} */
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
      // matchedKeys is pushed only AFTER the capability check, so an exemption
      // whose source has since GAINED the affordance goes stale and fails --
      // which is what the staleness message promises. Pushing before made that
      // clause unreachable: the key stayed fresh as long as the slot kept the
      // modifier, however the source changed. `sites` stays the honest count of
      // everything examined, which is what the summary line reports.
      if (capability[family]) continue;
      matchedKeys.push(key);
      if (EXEMPT.has(key)) continue;
      findings.push({ component: name, slot, family, sources });
    }
  }
  return { findings, matchedKeys, sites };
}

/** @returns {{findings: {component: string, slot: string, family: string, sources: string[]}[], matchedKeys: string[]}} */
export function collect() {
  const findings = [];
  const matchedKeys = [];
  let sites = 0;
  const manifestFiles = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.manifest.json')).sort();
  for (const file of manifestFiles) {
    const manifest = JSON.parse(readFileSync(join(COMPONENTS_DIR, file), 'utf8'));
    const sources = resolveSources(manifest.component);
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
