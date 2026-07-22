import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stateFamilies,
  sourceImplements,
  classStringsBySlot,
  findReactSource,
  resolveSources,
  staleExemptions,
  evaluateManifest,
  collect,
  SOURCE_OVERRIDES,
  EXEMPT,
} from './check-manifest-states.mjs';

test('a plain class carries no state family', () => {
  assert.deepEqual([...stateFamilies('bg-primary text-base-content rounded-sm')], []);
});

test('hover: is detected as the hover family', () => {
  assert.deepEqual([...stateFamilies('bg-transparent hover:bg-base-200')], ['hover']);
});

test('focus, focus-visible and focus-within all count as the focus family', () => {
  assert.deepEqual([...stateFamilies('focus:ring-error')], ['focus']);
  assert.deepEqual([...stateFamilies('focus-visible:ring-error')], ['focus']);
  assert.deepEqual([...stateFamilies('focus-within:border-secondary')], ['focus']);
});

test('a stacked modifier still matches its family', () => {
  assert.deepEqual([...stateFamilies('sm:hover:bg-base-200')], ['hover']);
});

test('a substring that is not modifier-shaped does not false-positive', () => {
  // "shadow-2" contains no "hover:"/"focus:" boundary; a naive substring
  // search on the whole class list must not confuse "overflow-hidden" or
  // similar unrelated tokens for a state family either.
  assert.deepEqual([...stateFamilies('overflow-hidden shadow-2')], []);
});

test('a component with onMouseEnter/onMouseLeave implements hover, not focus', () => {
  const src = "function X() { return <button onMouseEnter={() => {}} onMouseLeave={() => {}} />; }";
  assert.deepEqual(sourceImplements(src), { hover: true, focus: false });
});

test('a component with onFocus/onBlur implements focus, not hover', () => {
  const src = "function X() { const [f,setF]=useState(false); return <input onFocus={()=>setF(true)} onBlur={()=>setF(false)} />; }";
  assert.deepEqual(sourceImplements(src), { hover: false, focus: true });
});

test('a component with neither implements neither', () => {
  const src = "function X() { return <button onClick={go} disabled={dis} />; }";
  assert.deepEqual(sourceImplements(src), { hover: false, focus: false });
});

test('an injected :hover in a template-literal style string counts as implementing hover', () => {
  const src = "const css = '.arena-input::-webkit-calendar-picker-indicator:hover{opacity:1}';";
  assert.equal(sourceImplements(src).hover, true);
});

test('classStringsBySlot reads both slots and every variant branch, merging same-named slots', () => {
  const manifest = {
    slots: { root: 'flex', nav: 'inline-flex hover:bg-base-200' },
    variants: {
      variant: {
        primary: { root: 'bg-primary hover:shadow-2' },
        ghost: { root: 'bg-transparent' },
      },
    },
  };
  const bySlot = classStringsBySlot(manifest);
  assert.deepEqual(bySlot.get('root'), ['flex', 'bg-primary hover:shadow-2', 'bg-transparent']);
  assert.deepEqual(bySlot.get('nav'), ['inline-flex hover:bg-base-200']);
});

test('findReactSource finds Pagination.jsx by a recursive search', () => {
  const found = findReactSource('Pagination');
  assert.ok(found, 'expected a match');
  assert.ok(found.endsWith('frameworks/react/components/navigation/Pagination.jsx'));
});

test('findReactSource returns null for a name with no matching file', () => {
  assert.equal(findReactSource('NoSuchComponentAtAll'), null);
});

test('Tag resolves through SOURCE_OVERRIDES to the Angular primitive, not React\'s Tag.jsx', () => {
  assert.deepEqual(resolveSources('Tag'), SOURCE_OVERRIDES.get('Tag'));
  assert.deepEqual(resolveSources('Tag'), ['frameworks/angular/primitives/tag/tag.ts']);
});

test('a manifest with no override and no matching React source throws rather than resolving silently', () => {
  assert.throws(() => resolveSources('DefinitelyNotARealComponentName'), /no React source found/);
});

test('staleExemptions reports nothing when every EXEMPT key appears in matchedKeys', () => {
  assert.deepEqual(staleExemptions([...EXEMPT.keys()]), []);
});

test('staleExemptions reports every EXEMPT key when matchedKeys is empty', () => {
  assert.deepEqual(staleExemptions([]).sort(), [...EXEMPT.keys()].sort());
});

test('staleExemptions reports only the keys missing from matchedKeys, not the ones present', () => {
  const keys = [...EXEMPT.keys()];
  if (keys.length < 1) return; // nothing to partition if EXEMPT is ever emptied
  const [first, ...rest] = keys;
  assert.deepEqual(staleExemptions(rest), [first]);
});

test('THE CORE CLAIM: the gate rejects a fabricated manifest carrying a hover its component does not implement', () => {
  // Regression guard for the exact defect this gate exists to catch:
  // Pagination.manifest.json shipped hover:bg-base-200 on `nav` when
  // Pagination.jsx has no onMouseEnter/onMouseLeave anywhere. Reproduce
  // that shape with a fabricated manifest and a fabricated source that
  // mirrors Pagination.jsx's real shape (a plain <button disabled={dis}>,
  // no mouse handler at all), calling the gate's own decision function --
  // not re-deriving the verdict from lower-level primitives by hand -- so
  // this is a real test of evaluateManifest, not of the test file's own logic.
  const fabricatedManifest = {
    component: 'Pagination',
    slots: { nav: 'inline-flex items-center hover:bg-base-200' },
  };
  const fabricatedSource = "export function Pagination({ page, onChange }) { return <button onClick={()=>onChange(page)} disabled={page<=1} aria-label='Previous' />; }";

  const { findings } = evaluateManifest(fabricatedManifest, fabricatedSource, ['<fabricated>']);
  assert.equal(findings.length, 1);
  assert.deepEqual(findings[0], { component: 'Pagination', slot: 'nav', family: 'hover', sources: ['<fabricated>'] });
});

test('evaluateManifest does NOT flag a state family the source genuinely implements', () => {
  const manifest = { component: 'Widget', slots: { root: 'hover:bg-base-200' } };
  const source = "function Widget(){ const [h,setH]=useState(false); return <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} />; }";
  const { findings } = evaluateManifest(manifest, source, ['<fabricated>']);
  assert.deepEqual(findings, []);
});

test('evaluateManifest honours an EXEMPT entry by key, and still records the matchedKey', () => {
  // Uses a real EXEMPT key from the module so this stays true to the actual
  // map rather than asserting against one this test invents.
  const [key] = [...EXEMPT.keys()];
  if (!key) return; // nothing to assert if EXEMPT is ever emptied
  const [component, slot, family] = key.split(':');
  const manifest = { component, slots: { [slot]: `${family}:something` } };
  const source = 'function X(){ return <div />; }'; // implements nothing
  const { findings, matchedKeys } = evaluateManifest(manifest, source, ['<fabricated>']);
  assert.deepEqual(findings, [], `${key} should have been exempted, not flagged`);
  assert.ok(matchedKeys.includes(key), 'an exempted hit must still count as matched, so staleExemptions can see it was exercised');
});

test('running against the real tree today produces no findings and no stale exemptions', () => {
  const { findings, matchedKeys } = collect();
  if (findings.length) {
    const detail = findings.map((f) => `${f.component}:${f.slot}:${f.family} (source: ${f.sources.join(', ')})`).join('\n  ');
    assert.fail(`unexpected invented state(s):\n  ${detail}`);
  }
  const stale = staleExemptions(matchedKeys);
  if (stale.length) assert.fail(`stale EXEMPT entries: ${stale.join(', ')}`);
});

test('every EXEMPT entry is exercised by the real tree (none is dead weight)', () => {
  const { matchedKeys } = collect();
  const stale = staleExemptions(matchedKeys);
  assert.deepEqual(stale, []);
});

/* A key is recorded as "matched" only when it was a real exemption CANDIDATE --
 * i.e. the source does NOT implement the family. If the source later gains the
 * affordance, the key stops being matched, any EXEMPT entry naming it goes
 * stale, and the gate fails so the now-unnecessary exemption gets removed.
 * Pushing the key before the capability check made that unreachable: the entry
 * stayed fresh forever as long as the slot kept the modifier, however the
 * source changed -- while the failure message promised exactly this case. */
test('a key stops being matched once its source implements the family', () => {
  const manifest = { component: 'Fab', slots: { root: 'inline-flex hover:bg-primary' } };

  const withoutHover = evaluateManifest(manifest, 'export function Fab() { return null; }', ['<x>']);
  assert.ok(
    withoutHover.matchedKeys.includes('Fab:root:hover'),
    'a source implementing no hover leaves the key an exemption candidate',
  );

  const withHover = evaluateManifest(manifest, 'onMouseEnter={() => setHover(true)}', ['<x>']);
  assert.ok(
    !withHover.matchedKeys.includes('Fab:root:hover'),
    'once the source implements hover the key is no longer a candidate, so an EXEMPT naming it goes stale',
  );
  assert.deepEqual(withHover.findings, [], 'and it is not a finding either -- the source implements it');

  assert.equal(withoutHover.sites, 1, 'both are still counted as sites examined');
  assert.equal(withHover.sites, 1);
});
