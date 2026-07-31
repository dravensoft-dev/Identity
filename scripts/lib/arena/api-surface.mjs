/* Reads a layer's declared API surface out of source text, by regex. A shape it
 * cannot read THROWS rather than going silently missing from the member list.
 * DOUBTS.md section 5 names three dormant blind spots. */

export class UnrecognisedShape extends Error {
  constructor(message) { super(message); this.name = 'UnrecognisedShape'; }
}

const PRIMITIVES = new Set(['string', 'number', 'boolean']);

const isConsumerData = (ts) => ts.trim().replace(/\s+/g, ' ') === 'Record<string, unknown>';

export const PLATFORM_TYPES = [
  'React.CSSProperties', 'CSSProperties',
  'React.Key', 'React.MouseEvent', 'React.HTMLInputTypeAttribute',
  'DOMRect', 'MouseEvent', 'Event', 'HTMLElement', 'unknown', 'any', 'object',
];

function wrapsWhole(ts) {
  let depth = 0;
  for (let i = 0; i < ts.length; i += 1) {
    if (ts[i] === '(') depth += 1;
    else if (ts[i] === ')') {
      depth -= 1;
      if (depth === 0) return i === ts.length - 1;
    }
  }
  return false;
}

export function classify(raw) {
  const ts = raw.trim();
  if (!ts) throw new UnrecognisedShape('empty type annotation');

  if (ts.startsWith('readonly ')) return classify(ts.slice('readonly '.length));

  const arms = splitTopLevel(ts, '|').map((s) => s.trim()).filter(Boolean);
  if (arms.length > 1) {
    const real = arms.filter((a) => a !== 'null' && a !== 'undefined');
    if (real.length > 0 && real.length !== arms.length) return classify(real.join(' | '));
  }

  if (ts.startsWith('(') && ts.endsWith(')') && wrapsWhole(ts)) return classify(ts.slice(1, -1));

  if (ts === 'React.ReactNode' || ts === 'ReactNode') return { form: 'slot' };
  if (PRIMITIVES.has(ts)) return { form: 'primitive', type: ts };

  if (isConsumerData(ts)) return { form: 'consumerData' };
  if (ts.endsWith('[]') && isConsumerData(ts.slice(0, -2))) {
    return { form: 'array', of: 'consumerData' };
  }

  if (PLATFORM_TYPES.includes(ts) || ts.startsWith('Record<') || /^React\./.test(ts)) {
    return { form: 'platform', type: ts };
  }

  if (ts.startsWith('{') && ts.endsWith('}') && !/^\{\s*\[/.test(ts)) {
    return { form: 'platform', type: ts };
  }

  const arrow = /^\(([\s\S]*)\)\s*=>\s*([\s\S]+)$/.exec(ts);
  if (arrow) {

    const returns = arrow[2].trim();
    if (returns !== 'void') {

      const nonNull = returns.split('|').map((s) => s.trim()).filter((s) => s !== 'null' && s !== 'undefined');
      const retType = nonNull.length === 1 ? classify(nonNull[0]) : { form: 'union' };
      if (retType.form === 'platform') return retType;
      if (retType.form === 'slot') {
        throw new UnrecognisedShape(
          `a function returning a node is a per-item renderer, and a per-item renderer is not a member: `
          + `the convention that removed ActivityFeed.renderItem removes it too (contracts/api/README.md). `
          + `It IS a parameterised slot and R3 permits it -- Angular is what does not, because per-item `
          + `projection needs ngTemplateOutlet, which no binding-table row covers and no reader function reads: ${ts}`,
        );
      }
      if (retType.form !== 'primitive' && retType.form !== 'named' && retType.form !== 'enum') {
        throw new UnrecognisedShape(`a functionInput return must be a primitive, enum or named type: ${ts}`);
      }
      const params = {};
      for (const part of splitTopLevel(arrow[1], ',').map((s) => s.trim()).filter(Boolean)) {
        const colon = part.indexOf(':');
        if (colon === -1) throw new UnrecognisedShape(`functionInput parameter has no type: ${ts}`);
        const pType = classify(part.slice(colon + 1));
        if (pType.form === 'platform') return pType;
        if (pType.form === 'slot') {
          throw new UnrecognisedShape(`a functionInput parameter may not be a node: ${ts}`);
        }

        params[part.slice(0, colon).trim()] = pType.type
          ?? (pType.form === 'consumerData' ? 'consumerData' : part.slice(colon + 1).trim());
      }
      return { form: 'functionInput', params, returns: retType.type ?? nonNull[0].trim() };
    }
    const params = arrow[1].trim();
    if (!params) return { form: 'event', payload: null };

    if (splitTopLevel(params, ',').length > 1) {
      throw new UnrecognisedShape(`an event takes one payload, and this declares more than one parameter: ${ts}`);
    }
    const colon = params.indexOf(':');
    if (colon === -1) throw new UnrecognisedShape(`event parameter has no type annotation: ${ts}`);
    const inner = classify(params.slice(colon + 1));
    if (inner.form === 'platform') return { form: 'event', payload: inner.type, platformPayload: true };

    if (inner.form === 'consumerData') return { form: 'event', payload: 'consumerData' };
    if (inner.form !== 'named' && inner.form !== 'primitive') {
      throw new UnrecognisedShape(`unreadable event payload: ${ts}`);
    }
    return { form: 'event', payload: inner.type };
  }

  const array =/^([\s\S]+)\[\]$/.exec(ts) ?? /^Array<([\s\S]+)>$/.exec(ts);
  if (array) {
    const inner = classify(array[1].trim());

    if (inner.form === 'union') return inner;

    if (inner.form === 'consumerData') return { form: 'array', of: 'consumerData' };
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

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

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

  for (const raw of splitTopLevel(stripComments(body), ';', { brackets: '(){}[]' })) {
    const text = raw.trim();
    if (!text) continue;
    const m = /^([A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/.exec(text);
    if (!m) throw new UnrecognisedShape(`unreadable interface member: ${text}`);
    members.push({ name: m[1], required: !m[2], ...classify(m[3]) });
  }
  return members;
}

export function angularSurface(source, className) {
  const decl = new RegExp(`export\\s+class\\s+${className}\\b[^{]*\\{`).exec(source);
  if (!decl) throw new UnrecognisedShape(`no "export class ${className}" in this source`);
  const body = braceBody(source, decl.index + decl[0].length - 1);
  const members = [];

  for (const raw of splitTopLevel(stripComments(body), ';', { brackets: '(){}[]', closeBrace: true })) {
    const text = raw.trim();

    if (!text || /^[{}\s]*$/.test(text)) continue;

    if (/^constructor\s*\(/.test(text)) {

      const params = braceBody(text, text.indexOf('('), '(', ')');

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

      if (inner.form === 'consumerData') return { name, form: 'event', required: false, payload: 'consumerData' };
      return { name, form: 'event', required: false, payload: inner.type ?? null };
    }

    const generics = splitTopLevel(type, ',');
    if (generics.length > 2) {
      throw new UnrecognisedShape(`input${required ? '.required' : ''}<${type}>(...) declares ${generics.length} generics -- Angular's input()/input.required() accept at most two (T, TransformT): ${init}`);
    }
    return { name, required: Boolean(required), ...classify(generics[0]) };
  }
  const bare = /^input\s*\(([\s\S]*)\)$/.exec(init);
  if (bare) {

    const firstArg = splitTopLevel(bare[1], ',')[0].trim();
    return { name, required: false, ...classify(literalType(firstArg, name)) };
  }
  throw new UnrecognisedShape(`unreadable member initialiser for "${name}": ${init}`);
}

function literalType(arg, name) {
  if (/^'[^']*'$/.test(arg) || /^"[^"]*"$/.test(arg)) return 'string';
  if (/^-?\d+(\.\d+)?$/.test(arg)) return 'number';
  if (arg === 'true' || arg === 'false') return 'boolean';
  throw new UnrecognisedShape(`input("${arg}") on "${name}" declares no type — give it a generic`);
}

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

export function templateSlots(source) {
  const out = [];
  for (const m of source.matchAll(/<ng-content\b([^>]*)>/g)) {
    const attrs = m[1];
    const select = /select\s*=\s*"([^"]*)"/.exec(attrs);
    if (!select) { out.push({ name: 'content', form: 'slot', required: false }); continue; }
    const attribute = /^\[([\w-]+)\]$/.exec(select[1].trim());
    if (!attribute) {
      throw new UnrecognisedShape(`ng-content select="${select[1]}" is not an attribute selector — see the binding table in contracts/api/README.md`);
    }
    out.push({ name: attribute[1], form: 'slot', required: false });
  }
  return out;
}
