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

test('an inbound function that RETURNS a value is the ninth form -- the refusal now holds only outside an input control', () => {
  /* HISTORY, and it is why the rule existed. `event` is the only outbound form
   * and it is a name plus a payload; the inbound forms were all data. A
   * formatter -- `(value: number) => string`, which BarChart, LineChart,
   * DoughnutChart and ThemeToggle all declared before plan 8B0 -- is inbound
   * AND returns, so it was none of the eight, and classify() refused it: read
   * as an event with payload `number` it would have let a contract declare a
   * formatter, both layers match it, and check:api report it green. The charts'
   * `valueFormatter` became `valueSuffix` for exactly that reason.
   *
   * The ninth form reverses the refusal for DATA-ENTRY CONTROLS ONLY. What
   * changed is where the refusal lives, not that it was dropped: classify()
   * reads the shape and the GATE holds the restriction -- a functionInput is
   * legal only in a contract carrying "kind": "input", so a chart declaring a
   * formatter still fails, now with a message naming the rule instead of a
   * reader that could not read it. */
  assert.deepEqual(classify('(value: number) => string'),
    { form: 'functionInput', params: { value: 'number' }, returns: 'string' });
  assert.deepEqual(classify('(isDark: boolean) => string'),
    { form: 'functionInput', params: { isDark: 'boolean' }, returns: 'string' });
  /* A zero-parameter inbound function is the same form with an empty signature.
   * Nothing about the arrow says whether it belongs to an input control, which
   * is the whole reason that judgement sits in the gate and not here. */
  assert.deepEqual(classify('() => string'),
    { form: 'functionInput', params: {}, returns: 'string' });
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

/* `Record<string, unknown>` left this list when the eighth form landed: it is
 * consumer data now, not an R4 escape. A record of a KNOWN type is still one,
 * and is here in its place -- see the consumer-data cases at the end of this
 * file. */
test('every platform type R4 names is recognised and reported, never thrown', () => {
  for (const t of ['React.CSSProperties', 'React.Key', 'React.MouseEvent', 'DOMRect',
    'React.HTMLInputTypeAttribute', 'Record<string, Widget>']) {
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

test('angularSurface does not cut a member at a template-literal interpolation\'s own } -- CommandPalette.ts\'s `arena-command-palette-${nextId++}` field', () => {
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
 * real shape StatCard.ts shipped) reported the same slot TWICE, and deleting
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

test('a required input with THREE generics is unreadable, not silently narrowed to the first', () => {
  assert.throws(
    () => angularSurface(
      'export class X {\n  readonly open = input.required<boolean, unknown, string>({ transform: booleanAttribute });\n}',
      'X',
    ),
    UnrecognisedShape,
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

/* The eighth form. contracts/api/README.md's own worked example for a parameterised slot
 * names a row type that cannot be declared -- a declared type is an object of
 * primitives/enums (R1) or an enum, and Arena does not know a consumer row's
 * fields. Table.jsx:28 states what the form actually is: `row[c.key]` indexes
 * the record by a key the CONSUMER named. R4 used to name
 * Record<string, unknown> among its escapes and no longer does: this form is
 * where that one exact spelling went, and Record<string, Widget> -- a record of
 * a KNOWN type, which is a predefined object -- stayed behind as an R4
 * violation. The promotion is one spelling wide, and the test below it pins
 * exactly that. */
test('classify reads Record<string, unknown> as consumer data rather than as a platform type', () => {
  assert.deepEqual(classify('Record<string, unknown>'), { form: 'consumerData' });
});

/* Both array spellings, because they take different routes through classify():
 * the `[]` suffix is recognised before the platform branch (which would
 * otherwise swallow it, since it starts with `Record<`), and the `Array<>`
 * form reaches the array branch and is admitted as an element there. */
test('classify reads an array of consumer data, which is how a row list is spelled', () => {
  assert.deepEqual(classify('Record<string, unknown>[]'), { form: 'array', of: 'consumerData' });
  assert.deepEqual(classify('Array<Record<string, unknown>>'), { form: 'array', of: 'consumerData' });
});

/* The form is narrow on purpose: it is the recognised Record shape and nothing
 * else. A record of a KNOWN type is a predefined object and must be declared as
 * one; an unreadable annotation must still throw. Otherwise the form becomes
 * the escape hatch R4 exists to close. */
test('classify still refuses a record of a known type rather than calling it consumer data', () => {
  assert.deepEqual(classify('Record<string, Widget>'), { form: 'platform', type: 'Record<string, Widget>' });
  assert.throws(() => classify('TableColumn<T>'), /unreadable type annotation/);
});

/* An event payload is one of the eighth form's two legal routes back out (the
 * other is a slot parameter), so BOTH layers have to be able to spell one. Each
 * had its own reason it could not:
 *
 *  - React's `(row: Record<string, unknown>) => void` tripped the
 *    more-than-one-parameter guard, which tested `params.includes(',')` -- and
 *    the comma inside `Record<string, unknown>` is not a parameter separator.
 *  - Angular's `output<Record<string, unknown>>()` read its payload off
 *    `inner.type`, which consumer data does not carry, so the payload silently
 *    came back `null` and no contract could ever match it.
 *
 * Both are pinned here. The payload is spelled by FORM name, the same way an
 * array's `of` is, because there is no declared type to name. */
test('an event payload may be consumer data, in either layer\'s spelling', () => {
  assert.deepEqual(
    classify('(row: Record<string, unknown>) => void'),
    { form: 'event', payload: 'consumerData' },
  );
  const { members } = angularSurface(
    'export class X {\n  readonly select = output<Record<string, unknown>>();\n}',
    'X',
  );
  assert.deepEqual(members, [{ name: 'select', form: 'event', required: false, payload: 'consumerData' }]);
});

/* The guard that had to be loosened must still fire. A generic's comma is not a
 * parameter separator; a real second parameter still is -- SideNav.onNav's
 * `(id: string, event: React.MouseEvent) => void` is the shape that message
 * exists for, and Plan C relies on it still throwing. */
test('a genuine second event parameter is still refused after the generic-comma fix', () => {
  assert.throws(
    () => classify('(id: string, event: React.MouseEvent) => void'),
    /more than one parameter/,
  );
  assert.throws(() => classify('(a: string, b: string) => void'), /more than one parameter/);
});

/* The ninth form. A data-entry control's inbound function -- validate, parse,
 * format -- returns a value, so it is neither an event (outbound, void) nor a
 * datum. The layer refused it everywhere until this form; it is legal only in
 * an input control, which check-api enforces, not classify. The signature is
 * modelled: params and return are type names, R4 holds inside. */
test('classify reads an inbound function that returns a value as a functionInput', () => {
  assert.deepEqual(classify('(value: string) => string'),
    { form: 'functionInput', params: { value: 'string' }, returns: 'string' });
});

test('classify reduces a nullable return to the non-null type', () => {
  assert.deepEqual(classify('(value: string) => string | null | undefined'),
    { form: 'functionInput', params: { value: 'string' }, returns: 'string' });
});

/* R4 holds inside the signature: a platform return is still a violation, so it
 * surfaces as platform rather than being smuggled in as a functionInput -- the
 * gate then reports it by name, exactly as it does for a platform member. */
test('classify surfaces a functionInput whose return is a platform type as platform, not as the ninth form', () => {
  assert.deepEqual(classify('(value: string) => React.MouseEvent'),
    { form: 'platform', type: 'React.MouseEvent' });
});

/* THE BOUNDARY, and it is an ENFORCEMENT rather than a gap. `(item: T) =>
 * React.ReactNode` is React's spelling of a PARAMETERISED SLOT (R3 -- a slot
 * that fills the interior of an element Arena renders), not of a function whose
 * RESULT Arena consumes as a value. R3 is NOT why the reader refuses it: R3
 * permits it, because it fills rather than replaces. It is refused because a
 * per-item renderer is not a member at all -- the convention that removed
 * `ActivityFeed.renderItem` removed `Calendar.renderEvent` and
 * `TableColumn.render` under the same reason, which is Angular: per-item
 * projection needs a structural directive and `ngTemplateOutlet`, a binding no
 * row of the binding table covers and no reader function reads. So no contract
 * may declare such a member, and refusing every one the reader meets is correct
 * rather than provisional. The message must keep saying so: an edit that
 * quietly reverts it to "not modelled yet" describes a future that was decided
 * against, and the third assertion below is what fails when someone tries. */
test('classify throws on a function returning a node -- that is a parameterised slot (R3), not a functionInput', () => {
  assert.throws(() => classify('(item: string) => React.ReactNode'), (err) => {
    assert.ok(err instanceof UnrecognisedShape);
    assert.match(err.message, /parameterised slot/i);
    assert.match(err.message, /R3/);
    /* The refusal names its actual reason -- the convention, or the Angular
     * fact behind it -- never the reader's own limitation. */
    assert.match(err.message, /renderItem|ngTemplateOutlet/);
    return true;
  });
});

/* A void arrow is still an event -- the ninth form did not change that half. */
test('a void arrow is still an event, not a functionInput', () => {
  assert.deepEqual(classify('(v: string) => void'), { form: 'event', payload: 'string' });
});

/* A functionInput's parameter list is split depth-aware, the same way the event
 * branch's own guard is: the comma inside a generic is not a separator. Unlike
 * an event, a functionInput may take more than one parameter -- an event carries
 * exactly one payload, but a validator reading its value alongside something
 * else is a signature, and the contract models the whole of it. */
test('classify reads every parameter of a functionInput, and a generic\'s comma is not a separator', () => {
  assert.deepEqual(classify('(value: string, other: number) => boolean'),
    { form: 'functionInput', params: { value: 'string', other: 'number' }, returns: 'boolean' });
  assert.deepEqual(classify('(row: Record<string, unknown>) => string'),
    { form: 'functionInput', params: { row: 'consumerData' }, returns: 'string' });
});

/* An optional annotation is the same annotation. `T | undefined` and `T | null`
 * are TypeScript's way of spelling optionality inline, and Angular's signal
 * inputs reach for it: `input<((value: string) => string) | undefined>()`. The
 * arrow branch is tested before the union branch, so a greedy backtrack used to
 * capture the RETURN as "string) | undefined" and die on it. Stripping a
 * trailing null/undefined arm first is what makes the two spellings agree. */
test('a nullable arrow annotation reads as the arrow it wraps', () => {
  assert.deepEqual(classify('((value: string) => string) | undefined'),
    { form: 'functionInput', params: { value: 'string' }, returns: 'string' });
  assert.deepEqual(classify('((v: string) => void) | null'),
    { form: 'event', payload: 'string' });
});

/* The strip must not eat a genuine union between two real types -- that is R5's
 * subject and must keep surfacing as a union, not as its first arm. */
test('stripping null/undefined does not collapse a genuine union', () => {
  assert.equal(classify('string | TabItem').form, 'union');
  assert.equal(classify('string | TabItem | undefined').form, 'union');
});

/* A bare optional primitive still reads as that primitive, which is what every
 * existing caller already relies on. */
test('a nullable primitive still reads as the primitive', () => {
  assert.deepEqual(classify('string | undefined'), { form: 'primitive', type: 'string' });
});

/* The reduction rejoins the REAL arms instead of keeping the first, and this is
 * the case that forces it. An inline literal union with a nullable arm is still
 * that enum: keeping one arm would read `'sm' | 'md' | undefined` as the single
 * value `'sm'`, and refusing to reduce at all would report a union -- an R5
 * violation -- for an annotation that declares no union between forms at all. */
test('an inline enum with a nullable arm is still that enum, with every value it declares', () => {
  assert.deepEqual(classify("'sm' | 'md' | undefined"),
    { form: 'enum', values: ['sm', 'md'] });
});

/* The unwrap moved ahead of the arrow branch, so it had to become balance-aware:
 * the naive `startsWith('(') && endsWith(')')` test it replaces would slice
 * `(a) | (b)` into `a) | (b` and read a union of two shapes that are not there.
 * Neither arm here is a form the vocabulary admits, so the verdict is a union
 * either way -- what this pins is that the ARMS survive intact. */
test('a union of two parenthesised arms is not mistaken for one wrapped annotation', () => {
  assert.deepEqual(classify('(DOMRect) | (HTMLElement)'),
    { form: 'union', parts: ['(DOMRect)', '(HTMLElement)'] });
});
