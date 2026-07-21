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
 * ('md', warmed by the two tests above) is a direct proof that the injection
 * happens before the cache is consulted and not after. */
test('the injection-context contract holds on a cache hit too, not only on the first call for a name', () => {
  assert.throws(
    () => readBreakpoint('md'),
    /NG0203|injection context/i,
    'a cached breakpoint must still require an injection context -- otherwise the contract depends on call order',
  );
});

test('containerWidth also requires an injection context -- it measures the caller\'s own host element', () => {
  assert.throws(() => containerWidth(), /NG0203|injection context/i);
});
