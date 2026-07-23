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
 * See api/README.md for the vocabulary and the per-layer binding table. */

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

  if (ts === 'React.ReactNode' || ts === 'ReactNode') return { form: 'slot' };
  if (PRIMITIVES.has(ts)) return { form: 'primitive', type: ts };
  if (PLATFORM_TYPES.includes(ts) || ts.startsWith('Record<') || /^React\./.test(ts)) {
    return { form: 'platform', type: ts };
  }

  const arrow = /^\(([\s\S]*)\)\s*=>\s*[\s\S]+$/.exec(ts);
  if (arrow) {
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

/** The balanced interior of the block whose opening brace is at `openIndex`.
 *  A depth counter, not a regex: an interface member can itself carry braces
 *  and a `.*?}` would stop at the first one. */
export function braceBody(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  throw new UnrecognisedShape('unbalanced braces');
}

/** Comments are stripped BEFORE splitting on `;`, because a semicolon inside a
 *  doc comment would otherwise cut a member in half. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** @returns {{heritage: string[], members: object[]}} */
export function reactSurface(source, interfaceName) {
  const decl = new RegExp(`export\\s+interface\\s+${interfaceName}\\b([^{]*)\\{`).exec(source);
  if (!decl) throw new UnrecognisedShape(`no "export interface ${interfaceName}" in this source`);
  const heritage = /extends\s+([^{]+)/.exec(decl[1]);
  const body = braceBody(source, decl.index + decl[0].length - 1);
  return {
    heritage: heritage ? heritage[1].split(',').map((h) => h.trim()).filter(Boolean) : [],
    members: interfaceMembers(body),
  };
}

function interfaceMembers(body) {
  const members = [];
  for (const raw of stripComments(body).split(';')) {
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
  for (const raw of stripComments(body).split(';')) {
    const text = raw.trim();
    /* A method body's statements split on `;` like anything else, so what is
     * left after skipping the `protected onX(...) {` fragment is a lone `}`.
     * Dropping brace-only fragments is what lets a primitive carry a method
     * without the reader mistaking its remains for a malformed member. */
    if (!text || /^[{}\s]*$/.test(text)) continue;
    if (/^(protected|private)\b/.test(text)) continue;
    const m = /^readonly\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(text);
    if (!m) throw new UnrecognisedShape(`unreadable class member: ${text}`);
    members.push(classMember(m[1], m[2]));
  }
  return { members: [...members, ...templateSlots(source)] };
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
  if (bare) return { name, required: false, ...classify(literalType(bare[1].trim(), name)) };
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

/** Angular's slots live in the template, not in a declaration. A bare
 *  <ng-content /> is the default slot, which the contract names `content`; an
 *  attribute selector names its own. Any other selector is refused: the binding
 *  table in api/README.md defines exactly these two forms. */
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
