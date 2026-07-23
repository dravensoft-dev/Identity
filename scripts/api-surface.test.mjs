/* The reader takes source TEXT, so every case here is a string literal and
 * nothing on disk is read. That is what keeps it runnable under plain node in
 * check-all's own test step, and it is the same design scripts/lib/
 * behaviour-compliance.mjs carries for the same reason.
 *
 * READING A .d.ts BY REGEX IS A REAL LIMITATION. These tests pin both halves of
 * how it is handled: a shape the reader knows and rejects (a platform type) is
 * REPORTED, and a shape the reader cannot read at all THROWS. What must never
 * happen is the third thing -- returning silently fewer members than the source
 * declares -- so several cases below assert on the member COUNT, not only on the
 * members they name. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classify, reactSurface, angularSurface, templateSlots, braceBody,
  UnrecognisedShape, PLATFORM_TYPES,
} from './lib/api-surface.mjs';

test('the three primitives classify as primitives', () => {
  for (const t of ['string', 'number', 'boolean']) {
    assert.deepEqual(classify(t), { form: 'primitive', type: t });
  }
});

test('a closed literal union is an enum, and its values come out in order', () => {
  assert.deepEqual(classify("'sm' | 'md' | 'lg'"), { form: 'enum', values: ['sm', 'md', 'lg'] });
});

test('a node type is a slot', () => {
  assert.deepEqual(classify('React.ReactNode'), { form: 'slot' });
  assert.deepEqual(classify('ReactNode'), { form: 'slot' });
});

test('a function type is an event, and its single parameter is the payload', () => {
  assert.deepEqual(classify('(crumb: Crumb) => void'), { form: 'event', payload: 'Crumb' });
  assert.deepEqual(classify('() => void'), { form: 'event', payload: null });
});

test('an array is one form discriminated by what it holds', () => {
  assert.deepEqual(classify('Crumb[]'), { form: 'array', of: 'Crumb' });
  assert.deepEqual(classify('string[]'), { form: 'array', of: 'string' });
  assert.deepEqual(classify('Array<Crumb>'), { form: 'array', of: 'Crumb' });
});

test('every platform type R4 names is recognised and reported, never thrown', () => {
  for (const t of ['React.CSSProperties', 'React.Key', 'React.MouseEvent', 'DOMRect',
    'React.HTMLInputTypeAttribute', 'Record<string, unknown>']) {
    assert.equal(classify(t).form, 'platform', t);
  }
  assert.ok(PLATFORM_TYPES.includes('React.CSSProperties'));
});

test('a union between forms is a union, not a coin-flip between them -- R5', () => {
  const out = classify('(string | TabItem)[]');
  assert.equal(out.form, 'union');
});

test('an unreadable annotation throws rather than reporting no member', () => {
  assert.throws(() => classify('{ [k: string]: unknown }'), UnrecognisedShape);
  assert.throws(() => classify('(a: string, b: string) => void'), UnrecognisedShape);
});

test('braceBody returns the balanced interior, not the first closing brace it meets', () => {
  const src = 'x { a: { b: 1 }; c: 2 } y';
  assert.equal(braceBody(src, src.indexOf('{')).trim(), 'a: { b: 1 }; c: 2');
});

test('reactSurface reads every member of a props interface, with its optionality', () => {
  const src = `
    import * as React from 'react';
    /** doc */
    export interface AppLogoProps {
      /** Both halves at once. */
      size?: 'sm' | 'md';
      mark: React.ReactNode;
      name: string;
    }
    export function AppLogo(props: AppLogoProps): JSX.Element | null;
  `;
  const { heritage, members } = reactSurface(src, 'AppLogoProps');
  assert.deepEqual(heritage, []);
  assert.equal(members.length, 3);
  assert.deepEqual(members.map((m) => [m.name, m.form, m.required]), [
    ['size', 'enum', false], ['mark', 'slot', true], ['name', 'primitive', true],
  ]);
});

test('reactSurface surfaces heritage -- the {...rest} escape is a member surface too', () => {
  const src = `export interface XProps extends React.HTMLAttributes<HTMLSpanElement> { a: string; }`;
  assert.deepEqual(reactSurface(src, 'XProps').heritage, ['React.HTMLAttributes<HTMLSpanElement>']);
});

test('reactSurface splits heritage only at depth zero -- a generic\'s own comma is not a heritage separator', () => {
  const src = `export interface LineChartProps extends Omit<BarChartProps, 'slots'> { a: string; }`;
  assert.deepEqual(reactSurface(src, 'LineChartProps').heritage, ["Omit<BarChartProps, 'slots'>"]);
});

test('reactSurface throws when the interface it was asked for is not there', () => {
  assert.throws(() => reactSurface('export interface YProps { a: string; }', 'XProps'), UnrecognisedShape);
});

test('angularSurface reads input, input.required, output and a defaulted bare input', () => {
  const src = `
    @Component({ selector: 'arena-x', template: \`<span>{{ name() }}</span>\` })
    export class X {
      readonly name = input.required<string>();
      readonly dim = input<string>();
      readonly size = input<Size>('md');
      readonly separator = input('/');
      readonly navigate = output<Crumb>();
      protected readonly styles = computed(() => xStyles({ size: this.size() }));
    }
  `;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => [m.name, m.form, m.required]), [
    ['name', 'primitive', true],
    ['dim', 'primitive', false],
    ['size', 'named', false],
    ['separator', 'primitive', false],
    ['navigate', 'event', false],
  ]);
  assert.equal(members.find((m) => m.name === 'navigate').payload, 'Crumb');
});

test('angularSurface ignores protected and private members -- they are not the public API', () => {
  const src = `export class X { readonly a = input<string>(); protected readonly b = computed(() => 1); private c = 2; }`;
  assert.deepEqual(angularSurface(src, 'X').members.map((m) => m.name), ['a']);
});

test('angularSurface steps over a method body without mistaking its remains for a member', () => {
  const src = `
    export class X {
      readonly navigate = output<Crumb>();
      protected onClick(crumb: Crumb, event: MouseEvent): void {
        this.navigate.emit(crumb);
      }
    }
  `;
  assert.deepEqual(angularSurface(src, 'X').members.map((m) => m.name), ['navigate']);
});

test('angularSurface throws on a public member whose initialiser it cannot read', () => {
  const src = `export class X { readonly a = somethingElse<string>(); }`;
  assert.throws(() => angularSurface(src, 'X'), UnrecognisedShape);
});

test('angularSurface reads the input(default, {transform}) idiom, classifying from the first argument alone', () => {
  const src = `export class X { readonly dismissible = input(false, { transform: booleanAttribute }); }`;
  assert.deepEqual(angularSurface(src, 'X').members, [
    { name: 'dismissible', required: false, form: 'primitive', type: 'boolean' },
  ]);
});

test('a bare input() with no argument at all still throws -- no generic and no default is no declared type', () => {
  const src = `export class X { readonly a = input(); }`;
  assert.throws(() => angularSurface(src, 'X'), UnrecognisedShape);
});

test('classify strips a leading readonly modifier before the array check -- Angular\'s input<readonly T[]>', () => {
  assert.deepEqual(classify('readonly ActivityItem[]'), { form: 'array', of: 'ActivityItem' });
});

test('a bare ng-content is the default slot, named content; an attribute selector names its own', () => {
  assert.deepEqual(templateSlots('<span><ng-content /></span>'),
    [{ name: 'content', form: 'slot', required: false }]);
  assert.deepEqual(templateSlots('<ng-content select="[mark]" /><ng-content select="[icon]"></ng-content>'),
    [{ name: 'mark', form: 'slot', required: false }, { name: 'icon', form: 'slot', required: false }]);
});

test('an ng-content selector that is not an attribute selector throws -- the binding table defines one form', () => {
  assert.throws(() => templateSlots('<ng-content select="img" />'), UnrecognisedShape);
});

test('reactSurface keeps a member whole across an internal ; inside its own annotation -- Onboarding.d.ts\'s anchorRect: DOMRect | { left: number; bottom: number }', () => {
  const src = `
    export interface XProps {
      open: boolean;
      anchorRect?: DOMRect | { left: number; bottom: number };
      extra: string;
    }
  `;
  const { members } = reactSurface(src, 'XProps');
  assert.equal(members.length, 3, 'the object literal\'s internal ; must not manufacture a fourth, bogus member');
  assert.deepEqual(members.map((m) => m.name), ['open', 'anchorRect', 'extra']);
  const anchorRect = members.find((m) => m.name === 'anchorRect');
  /* A naive, non-brace-aware split cuts this member at the object literal's
   * own internal ;, and the first half -- "DOMRect | { left: number" --
   * still matches the union branch on its own, so it was silently accepted
   * as a complete (but wrong) member instead of throwing or being rejected.
   * Pinning the FULL, correct parts is what catches that: a corrupted split
   * would produce parts ending in an unclosed "{ left: number" fragment. */
  assert.deepEqual(anchorRect, {
    name: 'anchorRect', required: false, form: 'union',
    parts: ['DOMRect', '{ left: number; bottom: number }'],
  });
});

test('a bare inline object-type annotation throws as unreadable, and the message names the whole thing -- Alert.d.ts\'s action: { label: string; onClick: () => void }', () => {
  const src = `
    export interface XProps {
      title?: string;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }
  `;
  /* Decision: an inline/anonymous object-type literal is not a recognised
   * form and THROWS, the same way `{ [k: string]: unknown }` already does
   * above -- the contract's predefined-object form (api/README.md) is
   * authored as a named type, so an ad hoc inline literal is refused rather
   * than added as a second, unnamed way to say the same thing. */
  assert.throws(() => reactSurface(src, 'XProps'), (err) => {
    assert.ok(err instanceof UnrecognisedShape);
    /* Before the fix this message named a fragment truncated by the object
     * literal's own internal ; ("{ label: string"), not the whole
     * annotation -- pinning the closing "}); }" portion proves the split
     * kept the member whole even though classify() still cannot read it. */
    assert.match(err.message, /\{ label: string; onClick: \(\) => void \}/);
    return true;
  });
});

test('angularSurface skips a protected computed with a multi-statement body -- its own internal ; must not split it', () => {
  const src = `
    export class X {
      readonly name = input<string>();
      protected readonly computedThing = computed(() => {
        const a = 1;
        return a;
      });
      readonly navigate = output<Crumb>();
    }
  `;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => m.name), ['name', 'navigate']);
});

test('angularSurface skips a constructor block, the same way protected and private members are -- a public member on either side still comes back', () => {
  const src = `
    export class X {
      readonly a = input<string>();
      constructor() {
        effect(() => {
          doSomething();
        });
      }
      readonly b = input<string>();
    }
  `;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => m.name), ['a', 'b']);
});

test('angularSurface reports template slots alongside declared members', () => {
  const src = `
    @Component({ template: \`<span><ng-content select="[mark]" /></span>\` })
    export class X { readonly name = input.required<string>(); }
  `;
  assert.deepEqual(angularSurface(src, 'X').members.map((m) => [m.name, m.form]),
    [['name', 'primitive'], ['mark', 'slot']]);
});
