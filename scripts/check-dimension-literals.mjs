/* Fails on a bare dimension literal in a token-governed property anywhere under
 * frameworks/. This is the machine form of the rule CLAUDE.md states in prose:
 * a dimension in a framework layer is a token or a derivation of tokens, and a
 * bare literal is a bug.
 *
 * It is not a tidiness check. Zero bare literals means every rendered value
 * resolves from tokens/src/, which is exactly the claim that changing a value
 * there moves every layer. This gate is the proof of that promise.
 *
 * It is the complement of check-arbitrary-values.mjs: that one keys on
 * Tailwind's bracket syntax, this one on literals in inline style objects.
 * Together they close both idioms.
 *
 * ARCHITECTURE. Earlier passes added one regex per syntactic shape (a
 * ternary branch, an arithmetic expression, a call argument) and each new
 * shape kept finding a shape the others could not see. This version instead
 * separates "where is a value" from "what is in it": readValue/expressionLeaves
 * find every terminal sub-expression a governed property's value (or a local
 * declaration's initializer) can bottom out at -- a ternary branch, an `||`/`??`
 * fallback, a plain leaf -- using balanced-text scanning rather than a single
 * regex, so nesting (`a ? (b ? 12 : 14) : 16`) is read correctly instead of
 * garbled. scanLeaf then judges each leaf once, the same way regardless of
 * which shape produced it.
 *
 *   bun scripts/check-dimension-literals.mjs                 -> exit 0 if none, 1 otherwise
 *   bun scripts/check-dimension-literals.mjs --report        -> the census, grouped
 *   bun scripts/check-dimension-literals.mjs --report=sites  -> one line per site: file:line  prop: raw
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const EXTENSIONS = ['.jsx', '.ts', '.tsx'];

/** Properties whose value Arena's token layer governs.
 *
 * boxShadow and transform join late and for one reason each: a focus ring is a
 * spread radius (--focus-width) written inside a shorthand, and a travel is a
 * distance written inside a function. Both were invisible while the properties
 * were ungoverned, which is how seven hand-written `2px` rings and a
 * translateX(18px) survived a gate that reports the tree clean. Neither
 * property needed a rule change to work: a percentage, a ratio inside scale()
 * and an angle already pass.
 *
 * strokeWidth joins for the attribute-form task below (Task 6): an SVG line's
 * stroke width is a border width in every sense the token layer cares about.
 * The rest of SVG_ATTRS deliberately does NOT join this set — `r`, `x`, `y`,
 * `cx`, `cy`, `x1`, `x2`, `y1`, `y2` are one- and two-letter names that
 * collide with ordinary object keys having nothing to do with CSS, and
 * governing them today would buy nothing: PROP_COLON only fires at a
 * colon in a scanned `.jsx`/`.ts`/`.tsx` file (EXTENSIONS, above), and a
 * grep of frameworks/ turns up no `r:`/`x:`/`cx:` object key anywhere in
 * that set. The one PAD-shaped object that would collide —
 * `chart-internals.js`'s own `PAD = { t: 8, r: 8, b: 28, l: 44 }` — is
 * invisible to this gate for an unrelated reason: it is a `.js` file, and
 * EXTENSIONS never includes `.js`. That is not a safety net this decision
 * can lean on — a `.jsx` file with the same PAD shape would collide the
 * moment `r` joined PROPS, since scanValue's gate is shared by every
 * scanner here, colon and attribute alike, with no way to govern `r` in
 * attribute position only. Adding these nine later is a judgment call
 * that needs the tree re-checked at that time, not a decision this
 * comment can make permanent. Those SVG_ATTRS members stay listed for
 * documentation and for the day a real quoted-literal site needs one of
 * them, but scanValue's gate means none of them is judged anywhere today
 * — every current chart/Checkbox site this task closes is fontSize,
 * strokeWidth, width, or height, all already governed. */
const PROPS = new Set([
  'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingInline', 'paddingBlock',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'gap', 'rowGap', 'columnGap',
  'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
  'borderWidth', 'borderRadius',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'right', 'bottom', 'left', 'inset', 'zIndex',
  'boxShadow', 'transform', 'strokeWidth',
]);

/* Some correct sites look exactly like defects, so they are named rather than
 * inferred — the same discipline check-tailwind-coverage.mjs applies to its
 * token exclusions. Keyed "<path>:<prop>:<raw>". staleExemptions() below is
 * what keeps this map honest as the code around it changes.
 *
 * Deliberately not stating a count here: this comment said "two" while the map
 * held five, which is the exact prose-drift this gate exists to prevent. Read
 * the entries. */
export const EXEMPT = new Map([
  ['frameworks/react/components/display/Calendar.jsx:zIndex:1',
   'local stacking inside a positioned container; does not join the global z order'],
  ['frameworks/react/components/charts/BarChart.jsx:top:`calc(${yOf(values[hover])}px - var(--sp-2))`',
   'yOf(values[hover]) projects the hovered data point onto the chart\'s own measured inner height — a runtime data-to-pixel projection, not a design dimension. Unlike Avatar\'s ratio (this same task turns that operand into a token), there is no token to give this one: the series values, their max, and the container\'s measured width all change at runtime, so nothing in tokens/src/ could stand in for it'],
  ['frameworks/react/components/charts/LineChart.jsx:top:`calc(${yOf(values[hover])}px - calc(var(--sp-1) * 2.5))`',
   'the same yOf(values[hover]) projection as BarChart\'s own exemption above — a data point\'s value mapped onto the chart\'s measured pixel height, not a token'],
  ['frameworks/react/components/display/Calendar.jsx:top:`calc(${y(m)}px - var(--sp-1))`',
   'y(m) projects a clock minute onto the visible hour range, itself driven by the dayStart/dayEnd props — a time-to-pixel projection, not a design dimension; there is no token for an arbitrary minute of the day'],
  ['frameworks/react/components/display/Calendar.jsx:height:`max(calc(var(--sp-1) * 4.5), ${rawH}px)`',
   'the max()\'s floor, calc(var(--sp-1) * 4.5), already reads a token, and stays governed — only the computed arm is exempt: rawH is an event\'s duration in minutes projected to pixels, the same data-to-pixel category as the two chart entries above, never a fixed dimension'],
  ['frameworks/angular/primitives/chart-internals.ts:width:\'1px\'',
   'SR_ONLY is the standard visually-hidden idiom, and its 1px box is not a design dimension — it is the smallest rendered area that keeps the element in the accessibility tree while clip:rect(0 0 0 0) hides it. 0 would drop it from the tree in some engines and defeat the whole point; any token value would make it visible. Nothing in tokens/src/ could stand in for it, because the number is a constraint of the a11y idiom, not of Arena\'s scale'],
  ['frameworks/angular/primitives/chart-internals.ts:height:\'1px\'',
   'the other axis of the same 1px visually-hidden box as the width entry above'],
  ['frameworks/angular/primitives/chart-internals.ts:margin:\'-1px\'',
   'the same idiom\'s negative pull, which must cancel exactly the 1px box above so the hidden table shifts no sibling — it is bound to that literal, not to Arena\'s spacing scale, and a token here would break the cancellation'],
]);

/** Units the token layer genuinely does not model, and that no token could
 *  usefully carry — a prose measure in `ch`, a share of a container in `%`, a
 *  grid track in `fr`, a viewport fraction, an angle. DTCG 2025.10 admits only
 *  px and rem in a dimension, so these are not expressible as tokens at all.
 *  Exported because check-arbitrary-values.mjs answers the same question about
 *  a Tailwind bracket and two lists would drift. `s`/`ms` stay local to
 *  FREE_UNITS below: this gate tolerates them, but --dur-* and --loop-* DO
 *  model duration, so a bracket carrying one is drift and must keep failing. */
export const UNMODELLED_UNITS = ['%', 'ch', 'fr', 'vh', 'vw', 'vmin', 'vmax', 'deg'];
const FREE_UNITS = [...UNMODELLED_UNITS, 's', 'ms'];
const FREE_UNIT = new RegExp(`^\\s*'?-?\\d*\\.?\\d+(${FREE_UNITS.join('|')})'?\\s*$`);
/** A number immediately carrying a unit — a candidate dimension literal,
 *  judged against FREE_UNITS above rather than against a fixed "bad" list.
 *  Whitespace between the digits and the letters is allowed here — CSS
 *  itself never has one, so `'4 px'` is not a legal length, it is a typo
 *  for `'4px'` that still asserts a bare dimension and must still fail.
 *  What whitespace must not do is let a *function name* stand in as a
 *  bogus unit: a naive `\d+\s*[a-z]+` reads `'0 calc(var(--sp-1) * 3)'` as
 *  `0` + unit `calc`, when "0" and the calc() are two different values in
 *  the same shorthand, not one value with a gap in it. The `(?!\()` guard
 *  is what tells the two apart — a real unit is never followed by `(`,
 *  only a function call is, so excluding that one shape keeps `calc(`,
 *  `min(`, `max(`, `rgba(` and friends from ever being misread as a unit
 *  while still catching a spaced-out `px`, `pt`, `em`. */
const UNIT_LITERAL = /\d*\.?\d+\s*(%|[a-z]+)\b(?!\()/g;
/** The whole value is a bare number (quoted or not). */
const BARE_NUMBER = /^\s*'?-?\d*\.?\d+'?\s*$/;
/** Zero, in the forms the layer writes it. */
const ZERO = /^\s*'?-?0(px|rem|em|%)?'?\s*$/;

/** A template interpolation, read with balanced braces so a nested `{}` inside
 *  the expression does not end it early. */
function stripInterpolations(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '$' && raw[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      for (; j < raw.length && depth > 0; j++) {
        if (raw[j] === '{') depth++;
        else if (raw[j] === '}') depth--;
      }
      // `9`, not `0`: the marker stands where a rendered number will, and it
      // must not read as the zero the ZERO rule forgives — `${d * 0.28}px`
      // renders a dimension, and that is exactly what has to be caught.
      out += '9';
      i = j - 1;
      continue;
    }
    out += raw[i];
  }
  return out;
}

/** @param {string} prop @param {string} rawValue
 *  @returns {{reason: string} | null} null when the value is legal */
export function scanValue(prop, rawValue) {
  if (!PROPS.has(prop)) return null;
  const raw = stripInterpolations(rawValue);
  if (ZERO.test(raw)) return null;
  if (FREE_UNIT.test(raw)) return null;

  // A var() is a token. Remove every one, then judge what is left: a
  // multiplier inside calc() is not a literal, a unit is.
  const withoutTokens = raw.replace(/var\(\s*--[a-z0-9-]+\s*\)/g, '');

  // A number carrying any unit is a dimension literal unless that unit is
  // on the free list above.
  for (const m of withoutTokens.matchAll(UNIT_LITERAL))
    if (!FREE_UNITS.includes(m[1]))
      return { reason: `a raw ${m[1]}, not a token` };

  // A bare number standing as the entire value asserts a dimension the
  // language never declared — fontSize: 13, zIndex: 1000, lineHeight: 1.
  if (!raw.includes('var(') && BARE_NUMBER.test(raw))
    return { reason: 'a bare number, not a token' };

  return null;
}

// --- Balanced-text reading -------------------------------------------
// Every function below scans character-by-character rather than with a
// single regex, because the thing they are bounding — a value, a ternary,
// an `||` chain — can nest arbitrarily, and a regex that assumes one level
// of nesting is exactly the bug findings 1 and 3 of fix pass 2 were: a
// value like `Math.max(8, d * 0.28)` or a chained ternary
// `a ? 4 : b ? 10 : 6` both defeated a purely regex-shaped scanner.

/** Advances past a string literal starting at `text[i]` (the opening
 *  `quote`), honoring backslash escapes. @returns the index of the closing
 *  quote (or the last index, if the string is unterminated). */
function skipString(text, i, quote) {
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\\') { j++; continue; }
    if (text[j] === quote) return j;
  }
  return text.length - 1;
}

/** Replaces every `//` and `/* *\/` comment in `text` with spaces (newlines
 *  stay newlines), so every scanner below sees only real code — string
 *  literals are respected the same way readValue respects them, so a `//`
 *  or `/*` inside a string is never mistaken for a comment start. This
 *  runs first, before any other scan, because this codebase's own house
 *  style backtick-quotes code references in prose comments (`` `width:` ``,
 *  `` `--sp-1` ``): a governed prop name followed by a colon and a stray
 *  backtick, sitting in a comment, is indistinguishable from a real
 *  `prop:` site to a scanner that does not know comments exist — it sends
 *  the balanced-text reader hunting for a closing backtick anywhere later
 *  in the file, and everything in between reads as one garbled value.
 *  Length and line numbers are preserved exactly (every replaced character
 *  becomes exactly one space, `\n` stays `\n`), so lineOf() stays correct
 *  on the blanked text. */
function blankComments(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"' || c === '`') {
      const end = skipString(text, i, c);
      out += text.slice(i, end + 1);
      i = end;
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      let j = i;
      while (j < text.length && text[j] !== '\n') { out += ' '; j++; }
      i = j - 1;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < text.length && !(text[j] === '*' && text[j + 1] === '/')) j++;
      const end = Math.min(j + 1, text.length - 1);
      for (let k = i; k <= end; k++) out += (text[k] === '\n' ? '\n' : ' ');
      i = end;
      continue;
    }
    out += c;
  }
  return out;
}

/** Reads a value starting at `text[start]` up to the first top-level
 *  character in `stopChars` — "top-level" meaning outside any
 *  `()`/`[]`/`{}` nesting and outside any string literal. This is what
 *  lets a value like `Math.max(8, d * 0.28)` (an inner comma) or a
 *  template string containing `{`/`}` be read whole, where a fixed-shape
 *  regex either stops too early or too late.
 *  @returns {{text: string, end: number}} */
function readValue(text, start, stopChars) {
  let i = start, depth = 0;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"' || c === '`') { i = skipString(text, i, c); continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; continue; }
    if (c === ')' || c === ']') { depth--; continue; }
    if (c === '}') { if (depth === 0 && stopChars.has('}')) break; depth--; continue; }
    if (depth === 0 && stopChars.has(c)) break;
  }
  return { text: text.slice(start, i), end: i };
}

/** `text` wrapped in one redundant pair of parens, stripped — `(b ? 12 :
 *  14)` becomes `b ? 12 : 14` so the ternary inside is reachable. Declines
 *  if the leading `(` does not close at the very end (`(a) + (b)` is not a
 *  single wrapped expression). */
function stripOuterParens(text) {
  const t = text.trim();
  if (t[0] !== '(' || t[t.length - 1] !== ')') return t;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === "'" || c === '"' || c === '`') { i = skipString(t, i, c); continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i === t.length - 1 ? t.slice(1, -1).trim() : t; }
  }
  return t;
}

/** Splits `text` on its first top-level `?`/`:` ternary pair, tracking
 *  ternary depth the same way parens are tracked (each top-level `?`
 *  increments, each top-level `:` decrements; the outer pair is the one
 *  that brings the count back to zero) — so a nested ternary's own `:`
 *  is never mistaken for the outer one's, the exact bug in
 *  `a ? (b ? 12 : 14) : 16` and in `size==='sm'?4:size==='lg'?10:6`
 *  (right-chained, no parens — the same shape, one fewer character).
 *  `?.` and `??` are excluded from starting a ternary. Object literals
 *  and type annotations never appear in a value position here, so every
 *  top-level `:` at this depth belongs to a ternary, not a key.
 *  @returns {{cond: string, a: string, b: string} | null} */
function splitTernary(text) {
  let depth = 0, qDepth = 0, qStart = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"' || c === '`') { i = skipString(text, i, c); continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; continue; }
    if (c === ')' || c === ']' || c === '}') { depth--; continue; }
    if (depth !== 0) continue;
    if (c === '?') {
      if (text[i + 1] === '.' || text[i + 1] === '?') { i++; continue; }
      if (qStart === -1) qStart = i;
      qDepth++;
    } else if (c === ':') {
      qDepth--;
      if (qDepth === 0) return { cond: text.slice(0, qStart), a: text.slice(qStart + 1, i), b: text.slice(i + 1) };
    }
  }
  return null;
}

/** Splits `text` on every top-level occurrence of `||` or `??` — the one
 *  other place this layer's literals hide behind an operator:
 *  `height || 12` and `height || width || 40`. Same depth/string
 *  discipline as splitTernary. */
function splitFallback(text) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'" || c === '"' || c === '`') { i = skipString(text, i, c); continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; continue; }
    if (c === ')' || c === ']' || c === '}') { depth--; continue; }
    if (depth === 0 && (text.startsWith('||', i) || text.startsWith('??', i))) {
      parts.push(text.slice(start, i));
      start = i + 2;
      i += 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/** Flattens a value expression into every terminal leaf it can bottom out
 *  at, recursing through nested ternaries and `||`/`??` chains. A leaf is
 *  whatever is left once no more top-level `?:`/`||`/`??` can be found —
 *  a literal, a token, an identifier, a call, an arithmetic expression.
 *  @returns {string[]} */
export function expressionLeaves(text) {
  const stripped = stripOuterParens(text);
  const ternary = splitTernary(stripped);
  if (ternary) return [...expressionLeaves(ternary.a), ...expressionLeaves(ternary.b)];
  const fallbackParts = splitFallback(stripped);
  if (fallbackParts.length > 1) return fallbackParts.flatMap(expressionLeaves);
  return [stripped.trim()];
}

/** Splits a call's argument list on top-level commas, tracking `[`/`]`
 *  depth so a bracketed index like `values[hover]` never causes a false
 *  split. Parens are excluded from the input by construction (see
 *  scanLeaf's single-level call match). */
function splitArgs(text) {
  const args = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '[') depth++;
    else if (c === ']') depth--;
    else if (c === ',' && depth === 0) { args.push(text.slice(start, i)); start = i + 1; }
  }
  args.push(text.slice(start));
  return args.map((a) => a.trim()).filter((a) => a.length > 0);
}

const CALL_SHAPE = /^([a-zA-Z_$][\w.$]*)\(([^()]*)\)$/;
const ARITH_SHAPE = /^[a-zA-Z_$][\w.$]*(?:\([^()]*\))?\s*[*+/-]\s*-?\d*\.?\d+$/;

/** Scans one leaf's text for every bare-literal sub-value it carries.
 *  Three shapes, tried in order: the leaf itself is a literal (direct,
 *  via scanValue — handles a plain value, quoted or not, and a raw unit
 *  anywhere in a shorthand string); the leaf is a single flat call, whose
 *  arguments are judged one at a time (`Math.max(8, d * 0.28)` flags `8`,
 *  leaves `d * 0.28` alone the same way a lone ratio would be); the leaf
 *  is an identifier (optionally with a single-level call prefix) combined
 *  arithmetically with a trailing number (`d * 0.4`, `y(m) - 5`) — always
 *  a violation, since that whole shape only exists to carry a literal.
 *  A nested-parens call (`Math.max(8, Math.min(d, 40))`) is deliberately
 *  out of scope for the same reason ARITH stays single-level: no real
 *  site has that shape, and a wider class needs real parsing, not a
 *  wider regex. Anything else — a plain identifier, a var() token, a
 *  legal free-unit value — returns no hits.
 *  @returns {{raw: string, reason: string}[]} */
function scanLeaf(prop, leaf) {
  const trimmed = leaf.trim();
  if (!trimmed) return [];

  const direct = scanValue(prop, trimmed);
  if (direct) return [{ raw: trimmed, reason: direct.reason }];

  const callMatch = CALL_SHAPE.exec(trimmed);
  if (callMatch) {
    const hits = [];
    for (const arg of splitArgs(callMatch[2])) {
      const hit = scanValue(prop, arg);
      if (hit) hits.push({ raw: arg, reason: hit.reason });
    }
    return hits;
  }

  if (ARITH_SHAPE.test(trimmed))
    return [{ raw: trimmed, reason: 'an inline literal in an arithmetic expression, not a token' }];

  return [];
}

/** @param {string} text @param {number} index
 *  @returns {number} 1-based line, counted by newlines up to `index`. */
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const COLON_STOP = new Set([',', '}']);
/** Finds every `<governed-prop>:` in `text` (object-literal position, not
 *  preceded by a word character or `.`) and returns its name and the
 *  index right after the colon, so the caller can read the value from
 *  there. Intentionally unfiltered by PROPS at the regex level, same as
 *  every scanner before this one — the filter happens once, by name,
 *  against PROPS, rather than duplicating that set into the regex. */
const PROP_COLON = /(?<![\w.])([a-zA-Z]+)\s*:\s*/g;

/** The colon-level scan alone, over already-blanked `text`: every
 *  `<governed-prop>:` value, flattened into leaves, each leaf judged by
 *  scanLeaf. Shared by scanText (the public entry point) and scanDataflow
 *  below, which needs the same pass to find which identifiers are used
 *  bare at a governed colon before it can trace them back to a
 *  declaration. */
function scanColonValues(text) {
  const out = [];
  for (const m of text.matchAll(PROP_COLON)) {
    const prop = m[1];
    if (!PROPS.has(prop)) continue;
    const valueStart = m.index + m[0].length;
    const { text: rawValue } = readValue(text, valueStart, COLON_STOP);
    const line = lineOf(text, m.index);
    for (const leaf of expressionLeaves(rawValue))
      for (const hit of scanLeaf(prop, leaf))
        out.push({ prop, raw: hit.raw, reason: hit.reason, line });
  }
  return out;
}

/** @param {string} text
 *  @returns {{prop: string, raw: string, reason: string, line: number}[]}
 *  `line` is 1-based, counted by newlines up to the match — it is what
 *  --report=sites and Task 3's classification pass locate a site by.
 *  Combines the direct colon-level scan with the dataflow rule below (a
 *  literal reached through an intermediate variable) — both need the same
 *  view of the file, so a caller gets the complete answer from one call
 *  rather than needing to know to call scanDataflow separately too. */
export function scanText(rawText) {
  const text = blankComments(rawText);
  return [...scanColonValues(text), ...scanDataflow(text)];
}

// --- Dataflow: a literal reached through a local variable ----------------
// `const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;` then `height: h`
// elsewhere in the file breaks every scanner above, which all require the
// literal to sit at (or be reachable from) a governed prop's own colon.
// Deliberately narrow, per the same review that asked for it: an
// identifier only qualifies if (a) it is declared with `const`/`let` and
// its initializer carries at least one genuine literal per the same
// leaf-scanning rules used at a colon, AND (b) that exact identifier later
// appears as a *bare* leaf — the whole value, or a whole ternary/fallback
// branch, with no member access, no call, no arithmetic — at a governed
// prop's colon in the same file. Both conditions are required: this layer
// carries roughly forty local `const x = ...<number>...` declarations, and
// most are indices, lengths and counts (`const n = values.length`, `const
// pct = Math.max(0, Math.min(100, ...))`) whose name never reaches a
// governed colon bare — condition (b) is what leaves them alone, not a
// guess about what a number "means".
const LOCAL_DECL = /(?<![\w.])(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*=\s*/g;
const STATEMENT_STOP = new Set([',', ';', '}']);
const BARE_IDENTIFIER = /^[a-zA-Z_$][\w$]*$/;

/** @param {string} text
 *  @returns {Map<string, {rhs: string, line: number}[]>} every local
 *  `const`/`let` declaration in the file, by name. A name can have more
 *  than one declaration (block-scoped shadowing, or a second variable of
 *  the same name in a different function) — every one is scanned. */
function localDeclarations(text) {
  const decls = new Map();
  for (const m of text.matchAll(LOCAL_DECL)) {
    const name = m[1];
    const start = m.index + m[0].length;
    const { text: rhs } = readValue(text, start, STATEMENT_STOP);
    if (!decls.has(name)) decls.set(name, []);
    decls.get(name).push({ rhs, line: lineOf(text, m.index) });
  }
  return decls;
}

/** @param {string} text
 *  @returns {{prop: string, raw: string, reason: string, line: number}[]}
 *  One entry per literal found in a qualifying declaration's initializer —
 *  reported at the declaration's own line (where the fix actually lands),
 *  not at the colon that revealed it reaches a governed property. */
function scanDataflow(text) {
  const bareUsages = new Map(); // identifier name -> governing prop (first one wins; see note below)
  for (const m of text.matchAll(PROP_COLON)) {
    const prop = m[1];
    if (!PROPS.has(prop)) continue;
    const valueStart = m.index + m[0].length;
    const { text: rawValue } = readValue(text, valueStart, COLON_STOP);
    for (const leaf of expressionLeaves(rawValue)) {
      const trimmed = leaf.trim();
      if (BARE_IDENTIFIER.test(trimmed) && !bareUsages.has(trimmed)) bareUsages.set(trimmed, prop);
    }
  }
  if (bareUsages.size === 0) return [];

  const decls = localDeclarations(text);
  const out = [];
  for (const [name, prop] of bareUsages) {
    const entries = decls.get(name);
    if (!entries) continue;
    for (const { rhs, line } of entries)
      for (const leaf of expressionLeaves(rhs))
        for (const hit of scanLeaf(prop, leaf))
          out.push({ prop, raw: hit.raw, reason: hit.reason, line });
  }
  return out;
}

// --- Injected CSS: a <style> string, not a JS object literal --------------
// Every @keyframes in this layer ships inside `s.textContent = '...'`,
// because an inline style object cannot express a keyframe. The scanners
// above are shaped for a JS object literal -- PROP_COLON only matches an
// unbroken run of letters (so CSS `box-shadow:` reads as a property named
// `shadow`, invisible, and `border-width:`/`margin-top:` misattribute to
// `width`/`top`), and readValue stops at `,` or `}` (right for a JS value,
// wrong for a `;`-terminated CSS declaration). `transform:translateY(8px)`
// in Dialog/Menu was caught before this task only by coincidence: `transform`
// has no hyphen in either grammar, and it happened to be the last
// declaration before a `}`.

/** CSS property names, kebab-case, mapped to the camelCase key PROPS uses.
 *  Only the governed ones are worth converting — anything else is skipped. */
function camel(prop) {
  return prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Every maximal run of string literals joined end-to-end by `+`, read as one
 *  body. Every injected `<style>` in this layer is actually built this way —
 *  Skeleton's shimmer is the real example, four literals deep
 *  (`'.arena-skeleton{background-image:...;' + 'background-size:...;animation:...}' + ...`)
 *  — so a rule's opening `{` and the declaration that follows it routinely
 *  sit in different literals. Judging one literal at a time is what let a
 *  brace-less fragment vanish from the shape test in scanInjectedCss below
 *  even though the concatenated whole is unmistakably CSS; this reassembles
 *  the run first so the shape test sees what the browser will.
 *  @param {string} text
 *  @returns {{body: string, index: number}[]} `index` is the run's first
 *  opening quote, which is what a reported hit's line number is measured
 *  from. */
function stringLiteralRuns(text) {
  const runs = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c !== "'" && c !== '"' && c !== '`') { i++; continue; }
    const index = i;
    let body = '';
    let j = i;
    for (;;) {
      const end = skipString(text, j, text[j]);
      body += text.slice(j + 1, end);
      j = end + 1;
      let k = j;
      while (k < text.length && /\s/.test(text[k])) k++;
      if (text[k] !== '+') break;
      let m = k + 1;
      while (m < text.length && /\s/.test(text[m])) m++;
      if (text[m] !== "'" && text[m] !== '"' && text[m] !== '`') break;
      j = m;
    }
    runs.push({ body, index });
    i = j;
  }
  return runs;
}

/** Declarations inside a string literal (or a `+`-joined run of them) that is
 *  really CSS.
 *
 *  Keyframes are the one thing an inline style object cannot express, so every
 *  animation in the layer ships as a <style> injected once — which put its
 *  dimensions outside every scanner here, because they sit in a string rather
 *  than at a `prop: value` site. A travel of `translateY(8px)` is the same
 *  literal whether it is written in JS or in CSS, and the gate now says so.
 *
 *  A run counts as CSS when its reassembled body contains a `{`, a `:` and a
 *  `;` or `}` — the shape of a rule. That is deliberately loose: a false
 *  positive costs a declaration being judged that did not need to be, and
 *  every judged declaration is judged by the same scanValue as the rest of
 *  the file. It is deliberately reassembled first, rather than just dropping
 *  `{` from the test: dropping it would let any string containing a bare
 *  `prop: value`-shaped fragment (a sentence with a colon in it, say) pass as
 *  CSS with no rule-shape evidence at all, which trades one miss for a wider
 *  one. Reassembling costs nothing a real site needs — a stray `+` between
 *  two unrelated strings never resolves to a `{`/`:`/`;`/`}` shape by
 *  accident — and keeps the shape test exactly as strict, just applied to
 *  the string the runtime actually builds instead of to an arbitrary slice
 *  of it.
 *  @param {string} rawText @returns {{prop: string, raw: string, reason: string, line: number}[]} */
export function scanInjectedCss(rawText) {
  const text = blankComments(rawText);
  const out = [];
  for (const { body, index } of stringLiteralRuns(text)) {
    if (!(body.includes('{') && body.includes(':') && /[;}]/.test(body))) continue;
    const line = lineOf(text, index);
    for (const decl of body.matchAll(/(?:^|[{;])\s*([a-z-]+)\s*:\s*([^;}]+)/g)) {
      const prop = camel(decl[1]);
      if (!PROPS.has(prop)) continue;
      const found = scanValue(prop, decl[2].trim());
      if (found) out.push({ prop, raw: decl[2].trim(), reason: found.reason, line });
    }
  }
  return out;
}

// --- SVG presentation attributes: prop="value", not prop: value ----------
// An SVG glyph is styled by attributes as often as by CSS -- `fontSize="10"`
// is the same literal as `fontSize: '10'`, which scanValue already flags,
// but DECL/PROP_COLON both require a colon, and a JSX attribute uses `=`.
// The value was always catchable; the position was not.

/** SVG presentation attributes that carry a dimension, read in `prop="value"`
 *  position as well as `prop: value`. An SVG glyph is styled by attributes as
 *  often as by CSS, and `fontSize="10"` is the same literal as
 *  `fontSize: '10'` — which scanValue already flags. Only the quoted-literal
 *  form is in scope: `r={hover ? 5 : 4}` is an expression binding, judged the
 *  same way every other expression in this file is, which is to say not at all
 *  unless it reaches a governed declaration.
 *
 *  strokeDasharray is deliberately absent. Its value is a rhythm of on/off
 *  runs, not a dimension, and there is no token family for a rhythm — adding
 *  one for the single `3 3` in LineChart would be worse than the literal.
 *
 *  Listing a name here does not put it in scope: scanAttributes routes
 *  through scanValue below, which gates on PROPS, so only the members that
 *  are ALSO in PROPS (fontSize, strokeWidth, width, height) can ever flag.
 *  The other nine are listed but currently inert — see the PROPS comment
 *  above for why they stay out and what would have to be true to add them. */
const SVG_ATTRS = new Set(['fontSize', 'strokeWidth', 'width', 'height', 'r', 'x', 'y', 'cx', 'cy', 'x1', 'x2', 'y1', 'y2']);

/** @param {string} rawText @returns {{prop: string, raw: string, reason: string, line: number}[]} */
export function scanAttributes(rawText) {
  const text = blankComments(rawText);
  const out = [];
  for (const m of text.matchAll(/(?<![\w.-])([a-zA-Z]+)\s*=\s*"([^"]*)"/g)) {
    const [, prop, value] = m;
    if (!SVG_ATTRS.has(prop)) continue;
    const found = scanValue(prop, `'${value}'`);
    if (found) out.push({ prop, raw: value, reason: found.reason, line: lineOf(text, m.index) });
  }
  return out;
}

/** A prop name that is not itself a governed CSS property, but that a named
 *  component assigns unmodified into one, one line away, in the same file
 *  — verified by reading the component, not inferred. This is deliberately
 *  a short, hand-curated list rather than a scan of every JSX attribute on
 *  every element: a generic scan cannot tell `<Icon size={16} />` (a
 *  rendered dimension) from `<Textarea rows={3} />` or `<input
 *  maxLength={20} />` (ordinary numeric props Arena's token layer has no
 *  opinion about) without the same "does this actually reach a governed
 *  CSS property" read this map already encodes by name. Growing this list
 *  costs the same review Calendar's zIndex EXEMPT entry costs — it is not
 *  free, and that is the point. `stalePassthrough()` is EXEMPT's own
 *  discipline applied here: a renamed component or prop must fail loudly,
 *  not match nothing in silence. */
const PASSTHROUGH = new Map([
  ['Icon', { prop: 'size', governs: 'fontSize' }],
  ['AppLogo', { prop: 'size', governs: 'width' }],
]);

/** A component's own default value for a passthrough prop or for a prop
 *  that is itself a governed CSS property name — `function Icon({ size =
 *  18 })` and `function Dialog({ width = 480 })` are the same blind spot:
 *  DECL requires `:`, and a destructured default uses `=`. Scoped to the
 *  text between a function's `({` and the matching `}) {` so a plain
 *  variable assignment elsewhere in the file (`const top = Math.min(...)`)
 *  is never in scope — only the parameter list itself is. */
const COMPONENT_PARAMS = /function\s+([A-Za-z_]\w*)\s*\(\{([\s\S]*?)\}\)\s*\{/g;
const PARAM_DEFAULT = /(?<![\w.])([a-zA-Z]+)\s*=\s*('[^']*'|"[^"]*"|`[^`]*`|[-\w.%]+)(?=[,\s]|$)/g;

/** @param {string} text
 *  @returns {{prop: string, raw: string, reason: string, line: number}[]} */
export function scanDefaultsAndCallSites(rawText) {
  const text = blankComments(rawText);
  const out = [];
  for (const fn of text.matchAll(COMPONENT_PARAMS)) {
    const [, name, params] = fn;
    const paramsStart = fn.index + fn[0].indexOf('{');
    const via = PASSTHROUGH.get(name);
    for (const m of params.matchAll(PARAM_DEFAULT)) {
      const [, prop, raw] = m;
      const governs = PROPS.has(prop) ? prop : (via && via.prop === prop ? via.governs : null);
      if (!governs) continue;
      const hit = scanValue(governs, raw);
      if (hit) out.push({ prop: governs, raw, reason: hit.reason, line: lineOf(text, paramsStart + m.index) });
    }
  }
  for (const [name, via] of PASSTHROUGH) {
    const re = new RegExp(`<${name}\\b[^>]*?\\b${via.prop}\\s*=\\s*\\{([^}]+)\\}`, 'g');
    for (const m of text.matchAll(re)) {
      const raw = m[1].trim();
      const hit = scanValue(via.governs, raw);
      if (hit) out.push({ prop: via.governs, raw, reason: hit.reason, line: lineOf(text, m.index) });
    }
  }
  return out;
}

/** @param {string} text
 *  @returns {{name: boolean, prop: boolean}} whether this file defines the
 *  component (`function <Name>`) and whether it defines or calls it with
 *  the registered prop — the two signals `stalePassthrough()` needs to
 *  tell "this component/prop still exists somewhere in the tree" from
 *  "this entry now matches nothing". */
function passthroughSightings(rawText) {
  const text = blankComments(rawText);
  const seen = new Set();
  for (const fn of text.matchAll(COMPONENT_PARAMS)) if (PASSTHROUGH.has(fn[1])) seen.add(fn[1]);
  for (const name of PASSTHROUGH.keys())
    if (new RegExp(`<${name}\\b`).test(text)) seen.add(name);
  return seen;
}

/** @param {Set<string>} seenComponents — every `PASSTHROUGH` key seen
 *  anywhere in the tree this run, as either a `function <Name>` or a
 *  `<Name` JSX tag.
 *  @returns {string[]} `PASSTHROUGH` keys that matched neither — the
 *  component (or its registered prop) was renamed or removed and the
 *  entry is now silently inert. */
export function stalePassthrough(seenComponents) {
  return [...PASSTHROUGH.keys()].filter((k) => !seenComponents.has(k));
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { yield* walk(p); continue; }
    // A .d.ts renders nothing at runtime -- there is no value here to be a
    // token or a literal. It would pass today by coincidence (TypeScript's
    // `prop?: type` breaks DECL on the `?`), which is the wrong reason for
    // a scanner whose job is to fail closed. Skipped explicitly instead.
    if (entry.endsWith('.d.ts')) continue;
    if (EXTENSIONS.some((e) => entry.endsWith(e))) yield p;
  }
}

/** @param {Set<string>} matchedKeys — every `<path>:<prop>:<raw>` a scan
 *  actually produced this run, before EXEMPT filtering.
 *  @returns {string[]} EXEMPT keys that matched nothing — a named
 *  exemption for a site that no longer produces a violation, because it
 *  was fixed, deleted, or its raw text changed shape. Named exemptions
 *  are only honest if a stale one is loud: `EXEMPT` is how `Calendar`'s
 *  local `zIndex` and the chart/`Calendar` data-to-pixel projections stay
 *  legal on purpose, and the same map going quietly out of date would let
 *  a real regression hide behind an entry nobody is reading anymore. */
export function staleExemptions(matchedKeys) {
  return [...EXEMPT.keys()].filter((k) => !matchedKeys.has(k));
}

function collect() {
  const found = [];
  const matchedKeys = new Set();
  const seenComponents = new Set();
  for (const file of walk(join(repoRoot, 'frameworks'))) {
    const rel = relative(repoRoot, file);
    const text = readFileSync(file, 'utf8');
    for (const name of passthroughSightings(text)) seenComponents.add(name);
    const hits = [...scanText(text), ...scanDefaultsAndCallSites(text), ...scanInjectedCss(text), ...scanAttributes(text)];
    for (const hit of hits) {
      const key = `${rel}:${hit.prop}:${hit.raw}`;
      matchedKeys.add(key);
      if (EXEMPT.has(key)) continue;
      found.push({ file: rel, ...hit });
    }
  }
  return { found, stale: staleExemptions(matchedKeys), stalePassthrough: stalePassthrough(seenComponents) };
}

/** The census: every violation grouped by property, then by value, with the
 *  files that carry it. This output is the authority for the classification
 *  pass — the spec's own counts are indicative and are superseded by it. */
function report(found) {
  const byProp = new Map();
  for (const f of found) {
    if (!byProp.has(f.prop)) byProp.set(f.prop, new Map());
    const byValue = byProp.get(f.prop);
    if (!byValue.has(f.raw)) byValue.set(f.raw, []);
    byValue.get(f.raw).push(f.file);
  }
  for (const [prop, byValue] of [...byProp].sort((a, b) => a[0].localeCompare(b[0]))) {
    const total = [...byValue.values()].reduce((n, files) => n + files.length, 0);
    console.log(`\n${prop}  (${total} site(s), ${byValue.size} distinct value(s))`);
    for (const [raw, files] of [...byValue].sort((a, b) => b[1].length - a[1].length))
      console.log(`  ${String(files.length).padStart(3)}x  ${raw}`);
  }
  console.log(`\ntotal: ${found.length} site(s)`);
}

/** One line per violation: file:line  prop: raw. The grouped report answers
 *  what to fix; this answers where — Task 3 assigns each of these to a
 *  family, and the eleven editing tasks after it need to find the exact
 *  line rather than re-deriving it through scanText by hand. Exactly one
 *  line per site, nothing else, so a plain line count is the site count. */
function reportSites(found) {
  const sorted = [...found].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  for (const f of sorted) console.log(`${f.file}:${f.line}  ${f.prop}: ${f.raw}`);
}

function main() {
  const { found, stale, stalePassthrough: stalePT } = collect();
  if (process.argv.includes('--report=sites')) { reportSites(found); return; }
  if (process.argv.includes('--report')) { report(found); return; }
  let failed = false;
  if (stale.length) {
    failed = true;
    console.error(`check-dimension-literals: ${stale.length} stale EXEMPT entr${stale.length === 1 ? 'y' : 'ies'} — named a site that no longer produces a violation\n`);
    for (const key of stale) console.error(`  ${key} — ${EXEMPT.get(key)}`);
    console.error('\nThe site was fixed, deleted, or its raw text changed shape. Remove the');
    console.error('entry, or re-key it to match the current text exactly.');
  }
  if (stalePT.length) {
    failed = true;
    if (stale.length) console.error('');
    console.error(`check-dimension-literals: ${stalePT.length} stale PASSTHROUGH entr${stalePT.length === 1 ? 'y' : 'ies'} — matched nothing in the tree\n`);
    for (const name of stalePT) console.error(`  ${name} — no "function ${name}" and no "<${name}" tag found anywhere under frameworks/`);
    console.error('\nThe component or its registered prop was renamed or removed. Update or');
    console.error('remove the PASSTHROUGH entry.');
  }
  if (found.length) {
    failed = true;
    if (stale.length || stalePT.length) console.error('');
    console.error(`check-dimension-literals: ${found.length} bare literal(s) under frameworks/\n`);
    for (const f of found) console.error(`  ${f.file}: ${f.prop}: ${f.raw} — ${f.reason}`);
    console.error('\nA dimension is a token or a derivation of tokens. Use var(--token), or');
    console.error('calc() over one where the scale is numeric. If neither fits, the token is');
    console.error('what is missing — add it to tokens/src/ first.');
  }
  if (failed) process.exit(1);
  console.log('check-dimension-literals: no bare literals under frameworks/, no stale exemptions');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
