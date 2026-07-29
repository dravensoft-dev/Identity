/* Fails on a bare dimension literal in a framework layer. EXEMPT and PASSTHROUGH are
 * asserted by name in the paired suite, so changing either is a change to both.
 * Two blind spots — kebab-case SVG attributes, Angular [style.x] — are in DOUBTS.md. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const EXTENSIONS = ['.jsx', '.ts', '.tsx'];

const PROPS = new Set([
  'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingInline', 'paddingBlock',

  'paddingInlineStart', 'paddingInlineEnd', 'paddingBlockStart', 'paddingBlockEnd',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginInline', 'marginBlock',
  'marginInlineStart', 'marginInlineEnd', 'marginBlockStart', 'marginBlockEnd',
  'gap', 'rowGap', 'columnGap',
  'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
  'borderWidth', 'borderRadius',

  'borderInline', 'borderBlock',
  'borderInlineStart', 'borderInlineEnd', 'borderBlockStart', 'borderBlockEnd',
  'insetInline', 'insetBlock',
  'insetInlineStart', 'insetInlineEnd', 'insetBlockStart', 'insetBlockEnd',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'right', 'bottom', 'left', 'inset', 'zIndex',
  'boxShadow', 'transform', 'strokeWidth',
]);

export const EXEMPT = new Map([
  ['frameworks/react/components/display/calendar/Calendar.jsx:zIndex:1',
   'local stacking inside a positioned container; does not join the global z order'],
  ['frameworks/react/components/display/calendar-event/CalendarEvent.jsx:zIndex:1',
   'local stacking inside a positioned container; does not join the global z order'],
  ['frameworks/react/components/charts/bar-chart/BarChart.jsx:top:`calc(${yOf(values[hover])}px - var(--sp-2))`',
   'yOf(values[hover]) projects the hovered data point onto the chart\'s own measured inner height — a runtime data-to-pixel projection, not a design dimension. Unlike Avatar\'s ratio (this same task turns that operand into a token), there is no token to give this one: the series values, their max, and the container\'s measured width all change at runtime, so nothing in contracts/design/ could stand in for it'],
  ['frameworks/react/components/charts/line-chart/LineChart.jsx:top:`calc(${yOf(values[hover])}px - calc(var(--sp-1) * 2.5))`',
   'the same yOf(values[hover]) projection as BarChart\'s own exemption above — a data point\'s value mapped onto the chart\'s measured pixel height, not a token'],
  ['frameworks/react/components/display/calendar/Calendar.jsx:top:`calc(${y(m)}px - var(--sp-1))`',
   'y(m) projects a clock minute onto the visible hour range, itself driven by the dayStart/dayEnd props — a time-to-pixel projection, not a design dimension; there is no token for an arbitrary minute of the day'],
  ['frameworks/react/components/display/calendar/Calendar.jsx:height:`max(calc(var(--sp-1) * 4.5), ${rawH}px)`',
   'the max()\'s floor, calc(var(--sp-1) * 4.5), already reads a token, and stays governed — only the computed arm is exempt: rawH is an event\'s duration in minutes projected to pixels, the same data-to-pixel category as the two chart entries above, never a fixed dimension'],
  ['frameworks/angular/DataVisuals.ts:width:\'1px\'',
   'SR_ONLY is the standard visually-hidden idiom, and its 1px box is not a design dimension — it is the smallest non-zero footprint that keeps the element in the accessibility tree, paired with clip:rect(0 0 0 0) to hide it regardless of box size. 0 would drop it from the tree in some engines and defeat the whole point. Nothing in contracts/design/ could stand in for it: the number is a constraint of the a11y idiom, and it must be a fixed literal for the negative margin below to cancel exactly'],
  ['frameworks/angular/DataVisuals.ts:height:\'1px\'',
   'the other axis of the same 1px visually-hidden box as the width entry above'],
  ['frameworks/angular/DataVisuals.ts:margin:\'-1px\'',
   'the same idiom\'s negative pull, which must cancel exactly the 1px box above so the hidden table shifts no sibling — it is bound to that literal, not to Arena\'s spacing scale, and a token here would break the cancellation'],

  ['frameworks/react/components/display/skeleton/Skeleton.card.entry.jsx:height:11px',
   'Skeleton.card.entry.jsx\'s `variant="line"` example paired with `width="45%"` — an arbitrary demo placeholder height, not on Arena\'s 4px spacing scale'],
  ['frameworks/react/components/display/skeleton/Skeleton.card.entry.jsx:height:90px',
   'Skeleton.card.entry.jsx\'s closing `variant="block"` example — an arbitrary demo placeholder height, not on Arena\'s 4px spacing scale'],
]);

export const UNMODELLED_UNITS = ['%', 'ch', 'fr', 'vh', 'vw', 'vmin', 'vmax', 'deg'];
const FREE_UNITS = [...UNMODELLED_UNITS, 's', 'ms'];
const FREE_UNIT = new RegExp(`^\\s*'?-?\\d*\\.?\\d+(${FREE_UNITS.join('|')})'?\\s*$`);

const UNIT_LITERAL = /\d*\.?\d+\s*(%|[a-z]+)\b(?!\()/g;

const BARE_NUMBER = /^\s*'?-?\d*\.?\d+'?\s*$/;

const ZERO = /^\s*'?-?0(px|rem|em|%)?'?\s*$/;

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

      out += '9';
      i = j - 1;
      continue;
    }
    out += raw[i];
  }
  return out;
}

export function scanValue(prop, rawValue) {
  if (!PROPS.has(prop)) return null;
  const raw = stripInterpolations(rawValue);
  if (ZERO.test(raw)) return null;
  if (FREE_UNIT.test(raw)) return null;

  const withoutTokens = raw.replace(/var\(\s*--[a-z0-9-]+\s*\)/g, '');

  for (const m of withoutTokens.matchAll(UNIT_LITERAL))
    if (!FREE_UNITS.includes(m[1]))
      return { reason: `a raw ${m[1]}, not a token` };

  if (!raw.includes('var(') && BARE_NUMBER.test(raw))
    return { reason: 'a bare number, not a token' };

  return null;
}

function skipString(text, i, quote) {
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\\') { j++; continue; }
    if (text[j] === quote) return j;
  }
  return text.length - 1;
}

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

export function expressionLeaves(text) {
  const stripped = stripOuterParens(text);
  const ternary = splitTernary(stripped);
  if (ternary) return [...expressionLeaves(ternary.a), ...expressionLeaves(ternary.b)];
  const fallbackParts = splitFallback(stripped);
  if (fallbackParts.length > 1) return fallbackParts.flatMap(expressionLeaves);
  return [stripped.trim()];
}

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

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const COLON_STOP = new Set([',', '}']);

const PROP_COLON = /(?<![\w.])([a-zA-Z]+)\s*:\s*/g;

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

export function scanText(rawText) {
  const text = blankComments(rawText);
  return [...scanColonValues(text), ...scanDataflow(text)];
}

const LOCAL_DECL = /(?<![\w.])(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*=\s*/g;
const STATEMENT_STOP = new Set([',', ';', '}']);
const BARE_IDENTIFIER = /^[a-zA-Z_$][\w$]*$/;

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

function scanDataflow(text) {
  const bareUsages = new Map();
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

function camel(prop) {
  return prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

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

const SVG_ATTRS = new Set(['fontSize', 'strokeWidth', 'width', 'height', 'r', 'x', 'y', 'cx', 'cy', 'x1', 'x2', 'y1', 'y2']);

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

const PASSTHROUGH = new Map([
  ['AppLogo', { prop: 'size', governs: 'width' }],
]);

const COMPONENT_PARAMS = /function\s+([A-Za-z_]\w*)\s*\(\{([\s\S]*?)\}\)\s*\{/g;
const PARAM_DEFAULT = /(?<![\w.])([a-zA-Z]+)\s*=\s*('[^']*'|"[^"]*"|`[^`]*`|[-\w.%]+)(?=[,\s]|$)/g;

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

function passthroughSightings(rawText) {
  const text = blankComments(rawText);
  const seen = new Set();
  for (const fn of text.matchAll(COMPONENT_PARAMS)) if (PASSTHROUGH.has(fn[1])) seen.add(fn[1]);
  for (const name of PASSTHROUGH.keys())
    if (new RegExp(`<${name}\\b`).test(text)) seen.add(name);
  return seen;
}

export function stalePassthrough(seenComponents) {
  return [...PASSTHROUGH.keys()].filter((k) => !seenComponents.has(k));
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { yield* walk(p); continue; }

    if (entry.endsWith('.d.ts')) continue;
    if (EXTENSIONS.some((e) => entry.endsWith(e))) yield p;
  }
}

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
    console.error('what is missing — add it to contracts/design/ first.');
  }
  if (failed) process.exit(1);
  console.log('check-dimension-literals: no bare literals under frameworks/, no stale exemptions');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
