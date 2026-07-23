/* Reads a layer's declared API surface out of its source TEXT.
 *
 * Deliberately generic, for the reason scripts/lib/behaviour-compliance.mjs is:
 * it takes a string and returns a member list, touching no DOM, no TypeScript
 * compiler and no framework runtime, so scripts/api-surface.test.mjs exercises
 * it under plain node and check-all can run the whole gate there.
 *
 * READING A .d.ts BY REGEX IS A REAL LIMITATION, and this states it rather than
 * hiding it. The reader recognises the member shapes this repository's
 * hand-written .d.ts files and Angular primitives actually use. Three outcomes,
 * and the third is the one that must never happen:
 *
 *   - a shape in the vocabulary            -> classified
 *   - a shape it knows and R4 forbids      -> {form: 'platform'}, REPORTED by the gate
 *   - a shape it cannot read at all        -> throws UnrecognisedShape
 *
 * A member the reader cannot parse is a gate FAILURE, never a member silently
 * missing from the list. That is why every unreadable branch below throws
 * instead of returning early or skipping the line.
 *
 * See api/README.md for the vocabulary and the per-layer binding table.
 *
 * THREE KNOWN BLIND SPOTS, dormant against today's corpus and not fixed here:
 * `splitTopLevel` tracks bracket nesting only and is not string-literal
 * aware -- a bracket character inside a quoted string at depth zero would
 * misalign the depth count. `braceBody` is a plain bracket counter with the
 * same gap one level up: no quote or comment awareness. No shape in the
 * corpus triggers either today; a quote-aware scanner is a larger change
 * than either was written to make. Third: the index-signature carve-out in
 * `classify` (`/^\{\s*\[/`) tests only the literal's FIRST member, so a mixed
 * literal such as `{ label: string; [k: string]: unknown }` -- a named field
 * alongside an index signature -- slips past the carve-out and is classified
 * as `platform` rather than thrown. No shape in the corpus is a mixed
 * literal today; this is known and dormant, not fixed here. */

/** Thrown when the reader meets a shape it does not recognise. Never caught
 *  inside this module. */
export class UnrecognisedShape extends Error {
  constructor(message) { super(message); this.name = 'UnrecognisedShape'; }
}

const PRIMITIVES = new Set(['string', 'number', 'boolean']);

/** R4's named list, plus the two catch-alls it names by shape. These are
 *  RECOGNISED on purpose: the reader knows exactly what each one is, and it is
 *  simply not in the vocabulary -- so it is reported as a rule violation rather
 *  than thrown as unreadable. Reported and thrown both fail the gate; the
 *  difference is whether the message can name the rule. */
export const PLATFORM_TYPES = [
  'React.CSSProperties', 'CSSProperties',
  'React.Key', 'React.MouseEvent', 'React.HTMLInputTypeAttribute',
  'DOMRect', 'MouseEvent', 'Event', 'HTMLElement', 'unknown', 'any', 'object',
];

/** One TypeScript type annotation, as one of the reader's outcomes.
 *  `form: 'named'` is not a verdict -- it is "an identifier I read but cannot
 *  resolve on my own"; the gate resolves it against api/types/ into an enum or
 *  an object, and reports it as undeclared if it is neither. */
export function classify(raw) {
  const ts = raw.trim();
  if (!ts) throw new UnrecognisedShape('empty type annotation');

  /* `readonly` is a modifier on the annotation, not part of its shape --
   * Angular's `input<readonly ActivityItem[]>([])` means exactly what
   * `input<ActivityItem[]>([])` would, so it is stripped before any other
   * test rather than left to make the array branch's trailing-`[]` check
   * fail on a leading word it never expected. */
  if (ts.startsWith('readonly ')) return classify(ts.slice('readonly '.length));

  if (ts === 'React.ReactNode' || ts === 'ReactNode') return { form: 'slot' };
  if (PRIMITIVES.has(ts)) return { form: 'primitive', type: ts };
  if (PLATFORM_TYPES.includes(ts) || ts.startsWith('Record<') || /^React\./.test(ts)) {
    return { form: 'platform', type: ts };
  }

  /* An anonymous inline object type is not a predefined object -- a predefined
   * object is declared in api/types/ and has a name. It is the same ad hoc
   * escape `Record<string, unknown>` is, and R4 forbids both. Reporting it as
   * a platform type lets the gate name the rule; throwing would only say the
   * reader gave up. (Alert.d.ts's `action: { label: string; onClick: () =>
   * void }` and Onboarding.d.ts's `anchorRect: DOMRect | { left: number;
   * bottom: number }` are the real cases.) An index-signature literal
   * (`{ [k: string]: unknown }`) is excluded on purpose: it declares no named
   * field at all, so it is not "an object type standing in for a name" the
   * way a record of fields is -- it stays an unreadable shape, thrown below. */
  if (ts.startsWith('{') && ts.endsWith('}') && !/^\{\s*\[/.test(ts)) {
    return { form: 'platform', type: ts };
  }

  const arrow = /^\(([\s\S]*)\)\s*=>\s*([\s\S]+)$/.exec(ts);
  if (arrow) {
    /* An arrow is an EVENT only if it returns void. `event` is the vocabulary's
     * one outbound form -- a name plus a payload -- and the six inbound forms
     * are all data; an inbound function that RETURNS a value is none of the
     * seven. Judging the arrow by its parameter alone read
     * `(value: number) => string` as an event with payload `number`, which
     * would have let a contract declare a formatter, both layers agree with it,
     * and check:api call it green. The return type is right there in the
     * declaration, so this is one of the few vocabulary edges the reader can
     * actually hold. See api/README.md, "The vocabulary: seven forms". */
    const returns = arrow[2].trim();
    if (returns !== 'void') {
      throw new UnrecognisedShape(
        `an inbound function that returns "${returns}" is none of the seven forms — `
        + `only an event (returning void) is a function member: ${ts}`,
      );
    }
    const params = arrow[1].trim();
    if (!params) return { form: 'event', payload: null };
    if (params.includes(',')) {
      throw new UnrecognisedShape(`an event takes one payload, and this declares more than one parameter: ${ts}`);
    }
    const colon = params.indexOf(':');
    if (colon === -1) throw new UnrecognisedShape(`event parameter has no type annotation: ${ts}`);
    const inner = classify(params.slice(colon + 1));
    if (inner.form === 'platform') return { form: 'event', payload: inner.type, platformPayload: true };
    if (inner.form !== 'named' && inner.form !== 'primitive') {
      throw new UnrecognisedShape(`unreadable event payload: ${ts}`);
    }
    return { form: 'event', payload: inner.type };
  }

  if (ts.startsWith('(') && ts.endsWith(')')) return classify(ts.slice(1, -1));

  const array = /^([\s\S]+)\[\]$/.exec(ts) ?? /^Array<([\s\S]+)>$/.exec(ts);
  if (array) {
    const inner = classify(array[1].trim());
    /* An array of a union is the union's problem, not the array's -- R5 names
     * `(string | TabItem)[]` explicitly, so it must surface as a union rather
     * than as an unreadable shape the message cannot explain. */
    if (inner.form === 'union') return inner;
    if (inner.form !== 'primitive' && inner.form !== 'named') {
      throw new UnrecognisedShape(`unreadable array element type: ${ts}`);
    }
    return { form: 'array', of: inner.type };
  }

  if (ts.includes('|')) {
    const parts = ts.split('|').map((p) => p.trim());
    if (parts.every((p) => /^'[^']*'$/.test(p))) {
      return { form: 'enum', values: parts.map((p) => p.slice(1, -1)) };
    }
    return { form: 'union', parts };
  }

  if (/^[A-Z][A-Za-z0-9]*$/.test(ts)) return { form: 'named', type: ts };
  throw new UnrecognisedShape(`unreadable type annotation: ${ts}`);
}

/** The balanced interior of the bracketed block whose opening character is at
 *  `openIndex`. A depth counter, not a regex: an interface member can itself
 *  carry braces and a `.*?}` would stop at the first one. Defaults to `{}`
 *  for its original caller (an interface or class body); the constructor
 *  parameter-property check below passes `(`/`)` to balance a parameter
 *  list against the constructor's OWN opening paren rather than the first
 *  `)` in the fragment, which can belong to a nested arrow-function type
 *  (`cb: (x: number) => void`) instead. */
export function braceBody(source, openIndex, open = '{', close = '}') {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    else if (source[i] === close) {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  throw new UnrecognisedShape(`unbalanced ${open}${close}`);
}

/** Comments are stripped BEFORE splitting on `;`, because a semicolon inside a
 *  doc comment would otherwise cut a member in half. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Splits `text` on `sep` only where bracket depth is zero, over the pairs
 *  named in `brackets` (default all four TypeScript can nest: `()`, `{}`,
 *  `[]`, `<>`). A plain `text.split(sep)` is wrong wherever `sep` can occur
 *  INSIDE one of those pairs: a heritage clause's own generic
 *  (`Omit<BarChartProps, 'slots'>`) or an `input()` call's trailing options
 *  object (`input(false, { transform: booleanAttribute })`) both carry a
 *  comma that is not the separator being split on.
 *
 *  Two callers -- `interfaceMembers` and `angularSurface`, splitting a whole
 *  member LIST on `;` rather than a single type or argument list on `,` --
 *  pass `brackets: '(){}[]'`, excluding angle brackets. Those bodies are
 *  real code, not a pure type position, and in real code `<`/`>` are as
 *  often comparison operators as generics; an unmatched one (`ConfirmDialog`'s
 *  `this.typed().length > 0` inside a `computed()` body) would throw the
 *  depth count off for everything after it. No legitimate use in this
 *  repository nests a `;` inside a bare `<...>` generic, so the omission
 *  costs nothing where it is made.
 *
 *  `closeBrace: true` (the same two callers, splitting a class body) ends a
 *  part the instant a `}` returns bracket depth to zero, with no `sep`
 *  there at all. A class member whose own body is `{ ... }` -- a method, a
 *  constructor -- carries no trailing `;`, so nothing but the brace itself
 *  marks where it ends and the next member begins; without this, a member
 *  with no semicolon after it merges into whatever follows, up to the next
 *  depth-zero `;`, silently swallowing a real member along with it.
 *
 *  A `{` is tracked as a TEMPLATE-LITERAL interpolation, never a member
 *  body, when the character immediately before it is `$` -- a field
 *  initialiser like `` `${this.uid}-listbox` `` returns bracket depth to
 *  zero at that `}` too, and without this distinction `closeBrace` cut the
 *  member in half there, before its own closing backtick and `;`. */
function splitTopLevel(text, sep, { brackets = '(){}[]<>', closeBrace = false } = {}) {
  const parts = [];
  const stack = [];
  let current = '';
  let prev = '';
  for (const ch of text) {
    const at = brackets.indexOf(ch);
    if (at !== -1 && at % 2 === 0) {
      stack.push(ch === '{' && prev === '$' ? 'template' : 'plain');
    } else if (at !== -1 && at % 2 === 1) {
      const kind = stack.pop();
      if (closeBrace && ch === '}' && stack.length === 0 && kind !== 'template') {
        current += ch;
        parts.push(current);
        current = '';
        prev = ch;
        continue;
      }
    }
    if (ch === sep && stack.length === 0) {
      parts.push(current);
      current = '';
      prev = ch;
      continue;
    }
    current += ch;
    prev = ch;
  }
  parts.push(current);
  return parts;
}

/** @returns {{heritage: string[], members: object[]}} */
export function reactSurface(source, interfaceName) {
  const decl = new RegExp(`export\\s+interface\\s+${interfaceName}\\b([^{]*)\\{`).exec(source);
  if (!decl) throw new UnrecognisedShape(`no "export interface ${interfaceName}" in this source`);
  const heritage = /extends\s+([^{]+)/.exec(decl[1]);
  const body = braceBody(source, decl.index + decl[0].length - 1);
  return {
    heritage: heritage ? splitTopLevel(heritage[1], ',').map((h) => h.trim()).filter(Boolean) : [],
    members: interfaceMembers(body),
  };
}

function interfaceMembers(body) {
  const members = [];
  /* Brace-depth aware: a plain `.split(';')` cuts straight through a member
   * annotation's own internal `;` -- an inline object type in a union
   * (`DOMRect | { left: number; bottom: number }`) is the real case that
   * exposed this, see Onboarding.d.ts's `anchorRect`. */
  for (const raw of splitTopLevel(stripComments(body), ';', { brackets: '(){}[]' })) {
    const text = raw.trim();
    if (!text) continue;
    const m = /^([A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/.exec(text);
    if (!m) throw new UnrecognisedShape(`unreadable interface member: ${text}`);
    members.push({ name: m[1], required: !m[2], ...classify(m[3]) });
  }
  return members;
}

/** @returns {{members: object[]}} declared members first, template slots after */
export function angularSurface(source, className) {
  const decl = new RegExp(`export\\s+class\\s+${className}\\b[^{]*\\{`).exec(source);
  if (!decl) throw new UnrecognisedShape(`no "export class ${className}" in this source`);
  const body = braceBody(source, decl.index + decl[0].length - 1);
  const members = [];
  /* Brace-depth aware, and split after a `}` that returns to depth zero as
   * well as after a top-level `;` -- see `splitTopLevel`'s own comment. A
   * `protected`/`private` computed with a multi-statement body
   * (`computed(() => { const a = ...; return a; })`) has its own internal
   * `;`s; a plain `.split(';')` cut through those and tested only the first
   * statement fragment against the skip below, throwing on the rest. A
   * `constructor() { ... }` needs the brace-close split for a different
   * reason: it ends with no `;` at all, so without it a constructor merges
   * into whatever member follows. */
  for (const raw of splitTopLevel(stripComments(body), ';', { brackets: '(){}[]', closeBrace: true })) {
    const text = raw.trim();
    /* A brace-only or blank fragment can still occur -- e.g. the leftover
     * after a public field's own object-literal value closes to depth zero
     * ahead of its trailing `;`. Dropping it is what lets a primitive carry
     * one without the reader mistaking its remains for a malformed member. */
    if (!text || /^[{}\s]*$/.test(text)) continue;
    /* A constructor is never part of a component's declared API member
     * surface, the same reason `protected`/`private` are skipped here --
     * EXCEPT when it uses TypeScript's parameter-property idiom
     * (`constructor(public readonly foo: string) {}`), which declares a
     * genuinely public member in the parameter list rather than in the
     * class body. Skipping that constructor the same way would silently
     * swallow a real API member with nothing to say so -- exactly the
     * outcome this module forbids -- so a parameter list carrying an
     * access modifier throws instead of being skipped. */
    if (/^constructor\s*\(/.test(text)) {
      /* The parameter list must be balanced against the constructor's OWN
       * opening paren, via braceBody -- not "up to the first )", which a
       * parameter carrying a function type (`cb: (x: number) => void, ...`)
       * would truncate at the arrow type's closing paren, silently dropping
       * every parameter after it (and with it, a real parameter-property
       * modifier the truncated tail would have carried). */
      const params = braceBody(text, text.indexOf('('), '(', ')');
      /* Split into individual parameters at PARAMETER-LIST depth zero and
       * check only each parameter's OWN leading modifier -- not "does the
       * word public/private/protected/readonly occur anywhere in the
       * parameter list" -- so a default value that merely contains one of
       * those words as an identifier (`x = { readonly: true }`) is not
       * mistaken for an access modifier. A real parameter property always
       * carries its modifier(s) at the very start of its own parameter,
       * so this is exact, not a heuristic. */
      const hasParameterProperty = splitTopLevel(params, ',', { brackets: '(){}[]' })
        .some((p) => /^\s*(public|private|protected|readonly)\b/.test(p));
      if (hasParameterProperty) {
        throw new UnrecognisedShape(
          `constructor uses the parameter-property idiom, which declares a public member the reader does not read: ${text}`,
        );
      }
      continue;
    }
    if (/^(protected|private)\b/.test(text)) continue;
    const m = /^readonly\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(text);
    if (!m) throw new UnrecognisedShape(`unreadable class member: ${text}`);
    members.push(classMember(m[1], m[2]));
  }
  return { members: [...members, ...templateSlots(componentTemplate(source))] };
}

function classMember(name, initialiser) {
  const init = initialiser.trim();
  const generic = /^(input|output|model)(\.required)?\s*<([\s\S]*)>\s*\(([\s\S]*)\)$/.exec(init);
  if (generic) {
    const [, kind, required, type] = generic;
    if (kind === 'output') {
      const inner = type.trim() === 'void' ? { payload: null } : classify(type);
      if (inner.form === 'platform') return { name, form: 'event', required: false, payload: inner.type, platformPayload: true };
      return { name, form: 'event', required: false, payload: inner.type ?? null };
    }
    return { name, required: Boolean(required), ...classify(type) };
  }
  const bare = /^input\s*\(([\s\S]*)\)$/.exec(init);
  if (bare) {
    /* `input(false, { transform: booleanAttribute })` is one argument -- the
     * initial value -- plus a trailing options object the type is never
     * declared by. Only the first, depth-zero-split argument feeds
     * literalType; the options object is ignored rather than fed in whole,
     * which is what made this throw on every primitive using the idiom. */
    const firstArg = splitTopLevel(bare[1], ',')[0].trim();
    return { name, required: false, ...classify(literalType(firstArg, name)) };
  }
  throw new UnrecognisedShape(`unreadable member initialiser for "${name}": ${init}`);
}

/** `input('/')` declares its type by its default. No default and no generic
 *  means no declared type at all, which is a shape the reader refuses rather
 *  than guessing at. */
function literalType(arg, name) {
  if (/^'[^']*'$/.test(arg) || /^"[^"]*"$/.test(arg)) return 'string';
  if (/^-?\d+(\.\d+)?$/.test(arg)) return 'number';
  if (arg === 'true' || arg === 'false') return 'boolean';
  throw new UnrecognisedShape(`input("${arg}") on "${name}" declares no type — give it a generic`);
}

/** The interior of the `@Component({...})` decorator's own `template:` backtick
 *  literal -- never the whole source. A class doc comment sitting above the
 *  decorator can quote `<ng-content select="[x]" />` as PROSE (stat-card.ts
 *  does, describing its own `icon` slot), and prose is not markup: scanning
 *  the whole file for that reason reported the same slot twice, and -- worse
 *  -- deleting the real <ng-content> left the doc comment alone to satisfy
 *  the contract, so a component that stopped projecting a slot still passed.
 *  `stripComments()` is deliberately NOT run over the whole source first (the
 *  fix `templateSlots` itself warns against in its header): a `//` inside a
 *  URL in the template string would be eaten by the `//` half of that helper.
 *  Instead the decorator's argument is isolated by paren-depth (`braceBody`
 *  tracking `(`/`)`, which is blind to the `{`/`}` inside it -- an object
 *  literal argument does not change paren depth), and only the FIRST
 *  backtick-delimited `template:` literal inside that argument is scanned.
 *  No `@Component(...)` at all, or a decorator using `templateUrl` instead
 *  of an inline `template:`, means no slots -- returned as an empty string
 *  rather than thrown, because "this class has no slots" is not an
 *  unreadable shape. */
function componentTemplate(source) {
  const decorator = /@Component\s*\(/.exec(source);
  if (!decorator) return '';
  let args;
  try {
    args = braceBody(source, source.indexOf('(', decorator.index), '(', ')');
  } catch {
    return '';
  }
  const template = /template\s*:\s*`([\s\S]*?)`/.exec(args);
  return template ? template[1] : '';
}

/** Angular's slots live in the template, not in a declaration. A bare
 *  <ng-content /> is the default slot, which the contract names `content`; an
 *  attribute selector names its own. Any other selector is refused: the binding
 *  table in api/README.md defines exactly these two forms.
 *
 *  Takes the TEMPLATE TEXT itself -- a direct fragment in this module's own
 *  tests, or `componentTemplate(source)`'s extraction in `angularSurface`
 *  below. It does not go looking for the decorator itself; that is
 *  `componentTemplate`'s job, kept separate so a caller with an
 *  already-isolated template string (or a test fixture that is nothing but
 *  markup) never has to fabricate a surrounding `@Component({...})`. */
export function templateSlots(source) {
  const out = [];
  for (const m of source.matchAll(/<ng-content\b([^>]*)>/g)) {
    const attrs = m[1];
    const select = /select\s*=\s*"([^"]*)"/.exec(attrs);
    if (!select) { out.push({ name: 'content', form: 'slot', required: false }); continue; }
    const attribute = /^\[([\w-]+)\]$/.exec(select[1].trim());
    if (!attribute) {
      throw new UnrecognisedShape(`ng-content select="${select[1]}" is not an attribute selector — see the binding table in api/README.md`);
    }
    out.push({ name: attribute[1], form: 'slot', required: false });
  }
  return out;
}
