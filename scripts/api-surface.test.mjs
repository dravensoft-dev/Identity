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

test('an inbound function that RETURNS a value is refused -- no form in the vocabulary is one', () => {
  /* `event` is the only outbound form and it is a name plus a payload; the six
   * inbound forms are all data. A formatter -- `(value: number) => string`, which
   * BarChart, LineChart, DoughnutChart and ThemeToggle all declared before plan
   * 8B0 -- is inbound AND returns, so it is none of the seven. Before this rule
   * classify() read it as an event with payload `number`, which would have let a
   * contract declare it, both layers match it, and check:api report it green. */
  assert.throws(() => classify('(value: number) => string'), UnrecognisedShape);
  assert.throws(() => classify('(isDark: boolean) => string'), UnrecognisedShape);
  assert.throws(() => classify('() => string'), UnrecognisedShape);
});

test('an event still reads as an event -- the rule is the return type, not the arrow', () => {
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

test('a bare inline object-type annotation classifies as platform, reported rather than thrown -- Alert.d.ts\'s action: { label: string; onClick: () => void }', () => {
  const src = `
    export interface XProps {
      title?: string;
      action?: { label: string; onClick: () => void };
      onClose?: () => void;
    }
  `;
  /* REVERSED DECISION: a previous pass classified a bare inline object-type
   * literal as UnrecognisedShape (thrown), reasoning it was "the same ad hoc
   * escape R4 already forbids by name for Record<string, unknown>" -- but a
   * shape R4 forbids by name is exactly the definition of {form: 'platform'}
   * a few lines above in classify(), not of UnrecognisedShape. This test now
   * pins the corrected verdict: reported as platform, with the WHOLE,
   * uncorrupted literal text carried as `type`, so the gate can name the rule
   * R4 violates rather than the reader simply giving up. */
  const { members } = reactSurface(src, 'XProps');
  assert.equal(members.length, 3);
  const action = members.find((m) => m.name === 'action');
  assert.deepEqual(action, {
    name: 'action', required: false, form: 'platform',
    type: '{ label: string; onClick: () => void }',
  });
});

test('a union between a platform type and an inline object-type literal stays a union at the top level -- Onboarding.d.ts\'s anchorRect: DOMRect | { left: number; bottom: number }', () => {
  /* The containing member is a union (R5), so union classification applies
   * at the top level regardless of the reversed inline-object-type decision
   * above -- classify() never recurses into a union's parts, so the platform
   * branch for a bare `{...}` literal has no effect here: the whole
   * annotation does not itself start with `{`, it starts with `DOMRect`. */
  const out = classify('DOMRect | { left: number; bottom: number }');
  assert.deepEqual(out, { form: 'union', parts: ['DOMRect', '{ left: number; bottom: number }'] });
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

test('angularSurface does not cut a member at a template-literal interpolation\'s own } -- command-palette.ts\'s `arena-command-palette-${nextId++}` field', () => {
  const src = `
    export class X {
      readonly open = input(false, { transform: booleanAttribute });
      private readonly uid = \`arena-command-palette-\${nextId++}\`;
      readonly commands = input<Command[]>([]);
    }
  `;
  const { members } = angularSurface(src, 'X');
  assert.equal(members.length, 2, 'the interpolation\'s own } must not manufacture a spurious member split');
  assert.deepEqual(members.map((m) => m.name), ['open', 'commands']);
});

test('angularSurface skips a zero-parameter constructor and still returns its neighbouring public members', () => {
  const src = `export class X { readonly a = input<string>(); constructor() {} readonly b = input<string>(); }`;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => m.name), ['a', 'b']);
});

test('angularSurface throws on a constructor parameter property -- it declares a genuinely public member the reader does not read', () => {
  const src = `export class X { readonly a = input<string>(); constructor(public readonly foo: string) {} }`;
  assert.throws(() => angularSurface(src, 'X'), (err) => {
    assert.ok(err instanceof UnrecognisedShape);
    assert.match(err.message, /parameter-propert/i);
    return true;
  });
});

test('angularSurface throws on a constructor parameter property hidden behind a function-typed parameter -- the first ) is the arrow type\'s, not the constructor\'s', () => {
  const src = `
    export class X {
      readonly a = input<string>();
      constructor(cb: (x: number) => void, private y: string) {}
      readonly b = input<string>();
    }
  `;
  assert.throws(() => angularSurface(src, 'X'), (err) => {
    assert.ok(err instanceof UnrecognisedShape);
    assert.match(err.message, /parameter-propert/i);
    return true;
  });
});

test('angularSurface does not mistake a default value\'s bare "readonly" identifier for a parameter-property modifier', () => {
  const src = `
    export class X {
      readonly a = input<string>();
      constructor(x = { readonly: true }) {}
      readonly b = input<string>();
    }
  `;
  const { members } = angularSurface(src, 'X');
  assert.equal(members.length, 2);
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

/* CRITICAL: a class doc comment mentioning `<ng-content select="[icon]" />` in
 * prose must never manufacture a slot -- only the real @Component template
 * literal is the source of truth. Before this fix, templateSlots() scanned
 * the WHOLE source, so a doc comment merely quoting the template syntax (the
 * real shape stat-card.ts shipped) reported the same slot TWICE, and deleting
 * the real <ng-content> from the template left the doc comment alone to
 * satisfy the contract -- a component that stopped projecting a slot still
 * passed. These two tests pin the fix: the doc comment alone yields no slot,
 * and the real template yields exactly one. */
test('a class doc comment mentioning <ng-content select="[icon]" /> in prose reports no slot when the real template has none', () => {
  const src = `
    /** This component projects a glyph (\`<ng-content select="[icon]" />\`) beside the label. */
    @Component({ template: \`<span [class]="styles().label()">{{ label() }}</span>\` })
    export class X { readonly label = input.required<string>(); }
  `;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => m.name), ['label'], 'the doc comment must not manufacture an icon slot');
});

test('the same class with the real template projecting [icon] reports exactly one icon slot', () => {
  const src = `
    /** This component projects a glyph (\`<ng-content select="[icon]" />\`) beside the label. */
    @Component({ template: \`<span aria-hidden="true"><ng-content select="[icon]" /></span><span [class]="styles().label()">{{ label() }}</span>\` })
    export class X { readonly label = input.required<string>(); }
  `;
  const { members } = angularSurface(src, 'X');
  assert.deepEqual(members.map((m) => [m.name, m.form]), [['label', 'primitive'], ['icon', 'slot']]);
});

test('a required input with a transform reads its FIRST generic, which is the member type', () => {
  const { members } = angularSurface(
    'export class X {\n  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });\n}',
    'X',
  );
  assert.deepEqual(members, [{ name: 'open', required: true, form: 'primitive', type: 'boolean' }]);
});

test('a required input with a transform and NO generics declares no type and is refused', () => {
  assert.throws(
    () => angularSurface(
      'export class X {\n  readonly open = input.required({ transform: booleanAttribute });\n}',
      'X',
    ),
    /UnrecognisedShape|unreadable/,
  );
});

test('a class with no template literal at all (templateUrl, or no @Component) has no slots, and does not throw', () => {
  const withDecoratorNoTemplate = `
    @Component({ templateUrl: './x.html' })
    export class X { readonly label = input.required<string>(); }
  `;
  assert.deepEqual(angularSurface(withDecoratorNoTemplate, 'X').members.map((m) => m.name), ['label']);

  const withNoDecoratorAtAll = `export class X { readonly label = input.required<string>(); }`;
  assert.deepEqual(angularSurface(withNoDecoratorAtAll, 'X').members.map((m) => m.name), ['label']);
});
