/* Finds comments in JS/TS source by lexing, so a `//` inside a string, a template
 * literal or a regex is never mistaken for one. Used by check-docs.mjs; kept
 * DOM-free and dependency-free so it runs under plain node. */

const KEYWORDS_BEFORE_REGEX = new Set([
  'return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'instanceof',
  'do', 'else', 'yield', 'await', 'throw',
]);

const PUNCT_BEFORE_REGEX = new Set([
  '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%',
  '~', '^', '<', '>',
]);

function slashOpensRegex(source, at) {
  for (let i = at - 1; i >= 0; i -= 1) {
    const ch = source[i];
    if (/\s/.test(ch)) continue;
    if (PUNCT_BEFORE_REGEX.has(ch)) return true;
    if (/[A-Za-z0-9_$]/.test(ch)) {
      let j = i;
      while (j >= 0 && /[A-Za-z0-9_$]/.test(source[j])) j -= 1;
      return KEYWORDS_BEFORE_REGEX.has(source.slice(j + 1, i + 1));
    }
    return false;
  }
  return true;
}

function skipQuoted(source, at, quote) {
  let i = at + 1;
  while (i < source.length) {
    if (source[i] === '\\') { i += 2; continue; }
    if (source[i] === quote) return i + 1;
    i += 1;
  }
  return i;
}

function skipRegex(source, at) {
  let i = at + 1;
  let inClass = false;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '\n') return i;
    if (ch === '[') inClass = true;
    else if (ch === ']') inClass = false;
    else if (ch === '/' && !inClass) { i += 1; break; }
    i += 1;
  }
  while (i < source.length && /[a-z]/.test(source[i])) i += 1;
  return i;
}

export function findComments(source) {
  const found = [];
  let line = 1;
  let i = 0;

  const advance = (from, to) => {
    for (let k = from; k < to; k += 1) if (source[k] === '\n') line += 1;
  };

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === '\n') { line += 1; i += 1; continue; }

    if (ch === '/' && next === '/') {
      let end = source.indexOf('\n', i);
      if (end === -1) end = source.length;
      found.push({ line, lines: 1, text: source.slice(i, end) });
      i = end;
      continue;
    }

    if (ch === '/' && next === '*') {
      const close = source.indexOf('*/', i + 2);
      const end = close === -1 ? source.length : close + 2;
      const text = source.slice(i, end);
      found.push({ line, lines: text.split('\n').length, text });
      advance(i, end);
      i = end;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const end = skipQuoted(source, i, ch);
      advance(i, end);
      i = end;
      continue;
    }

    if (ch === '`') {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '\\') { j += 2; continue; }
        if (source[j] === '`') { j += 1; break; }
        if (source[j] === '$' && source[j + 1] === '{') {
          let depth = 1;
          const start = j + 2;
          let k = start;
          while (k < source.length && depth > 0) {
            const c = source[k];
            if (c === '{') depth += 1;
            else if (c === '}') depth -= 1;
            else if (c === '"' || c === "'") { k = skipQuoted(source, k, c) - 1; }
            else if (c === '`') {
              k += 1;
              while (k < source.length) {
                if (source[k] === '\\') { k += 2; continue; }
                if (source[k] === '`') break;
                k += 1;
              }
            }
            k += 1;
          }
          const interpolationStartLine = line + source.slice(i, start).split('\n').length - 1;
          for (const inner of findComments(source.slice(start, k - 1))) {
            found.push({ ...inner, line: interpolationStartLine + inner.line - 1 });
          }
          j = k;
          continue;
        }
        j += 1;
      }
      advance(i, j);
      i = j;
      continue;
    }

    if (ch === '/' && slashOpensRegex(source, i)) {
      const end = skipRegex(source, i);
      advance(i, end);
      i = end;
      continue;
    }

    i += 1;
  }

  return found.sort((a, b) => a.line - b.line);
}
