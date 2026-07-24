/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use.
 *
 * This file also covers `container-size.ts`, the layer's first shared
 * measurement helper -- PageHead is its first consumer, and five chart
 * primitives are meant to consume it unchanged. `readBreakpoint()` is
 * exercised through a real `runInInjectionContext`, with `DOCUMENT` provided
 * as a stub whose computed style is fully controlled, so the token-present,
 * token-absent and cache paths are all asserted against real injection
 * rather than against a mock of the function itself.
 *
 * It deliberately touches only `--bp-md` and `--bp-lg`. `container-size.ts`'s
 * breakpoint cache is module-level, and bun runs every file in this directory
 * in ONE process, so a name cached here would still be cached when
 * host-class-binding.test.ts renders `<arena-page-head>` -- whose own
 * assertions depend on `--bp-sm` resolving from that file's real happy-dom
 * document. Splitting the names keeps the two files order-independent.
 *
 * This split survives the Task 15 review fix below (a FAILED read is no
 * longer cached) because it was never about failures in the first place: a
 * SUCCESSFUL stubbed read -- '--bp-md' resolving to the fake `768` this file
 * asserts against -- is still cached for the life of the module, by design
 * (breakpoints are constants for the life of the document). If this file
 * stubbed '--bp-sm' too, that fake value, not a real 480, would be what
 * host-class-binding.test.ts's real render saw. The fix changes what happens
 * to a name this file never touches with a real value; it does not remove the
 * reason two files must not share one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENT, Injector, runInInjectionContext } from '@angular/core';
import { containerWidth, readBreakpoint } from '../primitives/container-size';
import { pageHeadStyles } from '../primitives/page-head/page-head.variants';

function injectorWith(properties: Record<string, string>): Injector {
  const doc = {
    documentElement: {},
    defaultView: {
      getComputedStyle: () => ({ getPropertyValue: (name: string) => properties[name] ?? '' }),
    },
  } as unknown as Document;
  return Injector.create({ providers: [{ provide: DOCUMENT, useValue: doc }] });
}

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(pageHeadStyles().root(), /(?:^|\s)flex(?=\s|$)/);
});

test('the default is the WIDE layout -- a page head renders as a row before anything has been measured', () => {
  const wide = pageHeadStyles();
  assert.match(wide.root(), /\bflex-row\b/);
  assert.match(wide.root(), /\bitems-start\b/);
  assert.match(wide.actions(), /\bw-auto\b/);
});

test('below the breakpoint the row stacks and the actions go full width', () => {
  const narrow = pageHeadStyles({ narrow: true });
  assert.match(narrow.root(), /\bflex-col\b/);
  assert.match(narrow.root(), /\bitems-stretch\b/);
  assert.match(narrow.actions(), /\bw-full\b/);
});

test('the two branches are mutually exclusive -- neither leaks the other\'s direction, alignment or width', () => {
  const wide = pageHeadStyles({ narrow: false });
  const narrow = pageHeadStyles({ narrow: true });
  assert.doesNotMatch(wide.root(), /\bflex-col\b/);
  assert.doesNotMatch(wide.root(), /\bitems-stretch\b/);
  assert.doesNotMatch(wide.actions(), /\bw-full\b/);
  assert.doesNotMatch(narrow.root(), /\bflex-row\b/);
  assert.doesNotMatch(narrow.root(), /\bitems-start\b/);
  assert.doesNotMatch(narrow.actions(), /\bw-auto\b/);
});

test('align="center", wide layout, centers the actions block against the title', () => {
  const centered = pageHeadStyles({ narrow: false, align: 'center' });
  assert.match(centered.root(), /\bitems-center\b/);
  assert.doesNotMatch(centered.root(), /\bitems-start\b/);
});

test('align="start" (the default), wide layout, keeps the actions block top-aligned', () => {
  const started = pageHeadStyles({ narrow: false, align: 'start' });
  assert.match(started.root(), /\bitems-start\b/);
  assert.doesNotMatch(started.root(), /\bitems-center\b/);
});

test('narrow always stretches, regardless of align', () => {
  const narrowCenter = pageHeadStyles({ narrow: true, align: 'center' });
  assert.match(narrowCenter.root(), /\bitems-stretch\b/);
  assert.doesNotMatch(narrowCenter.root(), /\bitems-center\b/);
  const narrowStart = pageHeadStyles({ narrow: true, align: 'start' });
  assert.match(narrowStart.root(), /\bitems-stretch\b/);
  assert.doesNotMatch(narrowStart.root(), /\bitems-start\b/);
});

test('the title is the display-weight heading React renders, with its own margin reset', () => {
  const title = pageHeadStyles().title();
  assert.match(title, /\bfont-display\b/);
  assert.match(title, /\bfont-extrabold\b/);
  assert.match(title, /\btext-h1\b/);
  assert.match(title, /\bm-0\b/);
});

test('the subtitle carries only the top margin React applies -- the paragraph\'s UA bottom margin is reset', () => {
  const subtitle = pageHeadStyles().subtitle();
  assert.match(subtitle, /\bmt-0\.5\b/);
  assert.match(subtitle, /\bmb-0\b/);
});

test('a page head is neutral chrome -- no slot carries a danger or accent surface', () => {
  const styles = pageHeadStyles();
  for (const slot of ['root', 'titles', 'title', 'subtitle', 'actions'] as const) {
    assert.doesNotMatch(styles[slot](), /error/, `${slot} paints a danger surface`);
  }
});

test('every slot resolves to a non-empty class string with no variant argument', () => {
  const styles = pageHeadStyles();
  for (const slot of ['root', 'titles', 'title', 'subtitle', 'actions'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});

test('readBreakpoint reads --bp-<name> off the document root and returns it as a number of px', () => {
  const value = runInInjectionContext(injectorWith({ '--bp-md': ' 768px ' }), () => readBreakpoint('md'));
  assert.equal(value, 768);
});

test('an absent breakpoint token is NaN, and every comparison against NaN is false -- which lands on the wide layout', () => {
  const value = runInInjectionContext(injectorWith({}), () => readBreakpoint('lg'));
  assert.ok(Number.isNaN(value), `expected NaN for an absent token, got ${value}`);
  assert.equal(1 < value, false, 'a NaN breakpoint must never select the narrow branch');
  assert.equal(9999 < value, false, 'a NaN breakpoint must never select the narrow branch');
});

/* Review finding on Task 15: the first draft cached a FAILED read (`NaN`)
 * exactly like a successful one, so the first caller to miss a not-yet-resolved
 * `--bp-<name>` pinned every later caller to the wide layout for the life of the
 * module, with no recovery. The fix caches only `Number.isFinite` results. This
 * is the direct proof: a name that fails once is re-read, not pinned, and a
 * later call that succeeds returns the real value. Uses 'lg' -- 'sm' is
 * reserved for host-class-binding.test.ts and 'md' already holds a cached real
 * value from the tests above; using either would either collide with that
 * file's real-document assertions or fail to prove anything new. */
test('a failed read is not cached -- a later call for the same name that succeeds returns the real value, not a pinned NaN', () => {
  const first = runInInjectionContext(injectorWith({}), () => readBreakpoint('lg'));
  assert.ok(Number.isNaN(first), `expected NaN for the failed first read, got ${first}`);
  const second = runInInjectionContext(injectorWith({ '--bp-lg': '1024px' }), () => readBreakpoint('lg'));
  assert.equal(second, 1024, 'a failed read must not be cached -- the next call must re-read and recover the real value');
});

test('a breakpoint is read once per name -- a later document with a different value does not change what was cached', () => {
  const second = runInInjectionContext(injectorWith({ '--bp-md': '1px' }), () => readBreakpoint('md'));
  assert.equal(second, 768, 'the cached value must win; breakpoints are constants for the life of the document');
});

/* Resolution D on this task. The helper as first drafted called
 * `inject(DOCUMENT)` AFTER the cache early-return, so the documented "call
 * from an injection context" contract only actually bound on the very first
 * call for a name -- every later caller got away with calling from anywhere,
 * and a component that worked in one test silently broke depending on which
 * file happened to warm the cache first. `inject()` throws NG0203 outside an
 * injection context, so asserting the throw ON A NAME THAT IS ALREADY CACHED
 * is a direct proof that the injection happens before the cache is consulted
 * and not after.
 *
 * Review finding on Task 15: the first version of this test relied on an
 * earlier test in this file having already warmed the 'md' cache, which made
 * it pass only by file order -- run in isolation, a cold first call throws
 * NG0203 even with `inject(DOCUMENT)` left UN-hoisted after the cache
 * early-return, so an isolated run would have passed tautologically and
 * proved nothing about hoisting. This test now warms its own cache in its own
 * body, with its own stubbed document, so it is order-independent: it fails
 * for real if the hoist is reverted, whether run alone or as part of the
 * suite. */
test('the injection-context contract holds on a cache hit too, not only on the first call for a name', () => {
  runInInjectionContext(injectorWith({ '--bp-md': '768px' }), () => readBreakpoint('md'));
  assert.throws(
    () => readBreakpoint('md'),
    /NG0203|injection context/i,
    'a cached breakpoint must still require an injection context -- otherwise the contract depends on call order',
  );
});

test('containerWidth also requires an injection context -- it measures the caller\'s own host element', () => {
  assert.throws(() => containerWidth(), /NG0203|injection context/i);
});
