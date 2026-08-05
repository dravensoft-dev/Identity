import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { pascal } from './layers.mjs';

export const PATTERN_DIR = 'contracts/behaviour';

const NONE = 'none';
const ABSENT = 'absent';
const REQUIRES_OPTIONAL = new Set([NONE, ABSENT]);

export function validatePattern(fileStem, pattern) {
  const problems = [];
  if (pattern.name !== fileStem) {
    problems.push(`${fileStem}: name "${pattern.name}" does not match its filename`);
  }
  if (!pattern.source) {
    problems.push(`${fileStem}: no source — a pattern is adopted, not invented, and must cite where from`);
  }
  const keys = Object.keys(pattern.requires ?? {});
  if (!REQUIRES_OPTIONAL.has(fileStem) && keys.length === 0) {
    problems.push(`${fileStem}: requires is empty — a pattern must state at least one requirement`);
  }
  for (const key of keys) {
    if (!key.includes('.')) {
      problems.push(`${fileStem}: requirement "${key}" must be dotted (group.leaf) so an exception can name exactly one`);
    }
  }
  return problems;
}

export function loadPatterns(root) {
  const dir = join(root, PATTERN_DIR);
  const out = new Map();
  for (const entry of readdirSync(dir).sort()) {
    if (extname(entry) !== '.json') continue;
    const stem = basename(entry, '.json');
    out.set(stem, JSON.parse(readFileSync(join(dir, entry), 'utf8')));
  }
  return out;
}

export function loadBinding(absPath) {
  return JSON.parse(readFileSync(absPath, 'utf8'));
}

export function bindingCases(binding) {
  if (!Array.isArray(binding.cases)) {
    return [{
      name: null,
      when: null,
      pattern: binding.pattern,
      reason: binding.reason ?? null,
      exceptions: binding.exceptions ?? [],
    }];
  }
  return binding.cases.map((c) => ({
    name: c.name ?? null,
    when: c.when ?? null,
    pattern: c.pattern,
    reason: c.reason ?? binding.reason ?? null,
    exceptions: c.exceptions ?? [],
  }));
}

export function validateBinding(component, layer, binding, patterns) {
  const problems = [];
  const where = `${layer}/${component}`;

  if ('pattern' in binding && Array.isArray(binding.cases)) {
    problems.push(`${where}: declares both "pattern" and "cases" — a binding declares one or the other. Two places for one fact is what deriving IDREF from IDREF_ATTRIBUTES fixed once already.`);
    return problems;
  }
  if (Array.isArray(binding.cases)) {
    const seen = new Set();
    for (const [i, c] of binding.cases.entries()) {
      if (!c.name) {
        problems.push(`${where}: cases[${i}] declares no "name". A case exists to say WHICH render it describes, so a nameless one declares the only thing it is for. It also skips the "when" requirement, because that rule can only fire on a named case.`);
        continue;
      }
      if (seen.has(c.name)) {
        problems.push(`${where}: declares the case name "${c.name}" more than once. crossLayerAgrees builds its per-name map last-write-wins, so only the last declaration would ever be compared across layers, and the earlier ones would be invisible rather than wrong.`);
      }
      seen.add(c.name);
    }
  }
  for (const c of bindingCases(binding)) {
    const label = c.name ? `${where} case "${c.name}"` : where;
    if (c.name !== null && !c.when) {
      problems.push(`${label}: a case must say WHEN it is produced. Prose is enough and prose is all that is possible -- nothing can verify a suite rendered the configuration a case names.`);
    }
    const pattern = patterns.get(c.pattern);
    if (!pattern) {
      problems.push(`${label}: unknown pattern "${c.pattern}" — no such file in ${PATTERN_DIR}`);
      continue;
    }
    if (REQUIRES_OPTIONAL.has(c.pattern) && !c.reason) {
      problems.push(`${label}: binding ${c.pattern} requires a reason — "nothing recorded", "verified presentational" and "does not exist here" must not look alike`);
    }
    for (const e of c.exceptions) {
      if (!(e.requirement in pattern.requires)) {
        problems.push(`${label}: excepts "${e.requirement}", which pattern "${c.pattern}" does not require`);
      }
      if (!e.reason) {
        problems.push(`${label}: exception for "${e.requirement}" has no reason`);
      }
    }
  }
  if ('delegatedTo' in binding && !binding.delegatedTo) {
    problems.push(`${where}: delegatedTo must name the third-party control that provides the behaviour, e.g. "SomeLibrary someControl". No entry declares one today; the branch stands so the first that does is checked.`);
  }

  if (layer === 'angular' && !binding.component) {
    problems.push(`${where}: an angular binding must declare "component", naming its React counterpart (e.g. "ArenaStatCard" for stat-card)`);
  }
  return problems;
}

export function crossLayerAgrees(a, b) {
  if (a.pattern === ABSENT || b.pattern === ABSENT) return true;

  const mine = bindingCases(a);
  const theirs = bindingCases(b);

  const patternsOf = (cs) => new Set(cs.map((c) => c.pattern));
  if (a.divergesFrom && patternsOf(theirs).has(a.divergesFrom)) return true;
  if (b.divergesFrom && patternsOf(mine).has(b.divergesFrom)) return true;

  const names = (cs) => cs.map((c) => c.name).sort().join(',');
  if (names(mine) !== names(theirs)) return false;

  if (Array.isArray(a.cases) || Array.isArray(b.cases)) {
    const byName = (cs) => new Map(cs.map((c) => [c.name, c.pattern]));
    const theirsByName = byName(theirs);
    return mine.every((c) => theirsByName.get(c.name) === c.pattern);
  }
  return a.pattern === b.pattern;
}

export function reactComponents(root) {
  const base = join(root, 'frameworks/react/components');
  const out = [];
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(base, category.name), { withFileTypes: true })) {
      if (dir.isDirectory()) out.push(pascal(dir.name));
    }
  }
  return out.sort();
}

export function angularPrimitives(root) {
  const base = join(root, 'frameworks/angular/components');
  const out = [];
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(base, category.name), { withFileTypes: true })) {
      if (dir.isDirectory()) out.push(dir.name);
    }
  }
  return out.sort();
}

export function angularBindingPath(root, dir) {
  const base = join(root, 'frameworks/angular/components');
  const stem = pascal(dir);
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const path = join(base, category.name, dir, `${stem}.behaviour.json`);
    if (existsSync(path)) return { path, stem, tail: `${category.name}/${dir}/${stem}.behaviour.json` };
  }
  return null;
}

export function reactBindingPath(root, dir) {
  const base = join(root, 'frameworks/react/components');
  const stem = pascal(dir);
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const tail = `${category.name}/${dir}/${stem}.behaviour.json`;
    const path = join(base, tail);
    if (existsSync(path)) return { path, stem, tail };
  }
  return null;
}
