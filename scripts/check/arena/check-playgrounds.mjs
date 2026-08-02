/* Asserts the playground fixtures against the API contracts they seed. There is no
 * exception map: a fixture supplies what a contract cannot invent, so a value it gets
 * wrong renders a page that lies while every other gate stays green. Type-checking a
 * seed is the whole point -- a component drawn from a bad seed still draws. The
 * citation check is here rather than in check:docs because it is the only mechanical
 * hold on a prompt naming a page path, and a moved page is exactly what this wave does. */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { LAYERS } from '../../lib/arena/layers.mjs';
import { playgroundModel, SUBJECT } from '../../lib/arena/playground-model.mjs';

export const FIXTURE_DIR = 'frameworks/demos';
export const FIXTURE_SUFFIX = '.demo.json';

const SEEDABLE = new Set(['primitive', 'enum', 'object', 'array', 'functionInput']);

export function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadTypes(base = root) {
  const dir = join(base, 'contracts/api/types');
  const out = new Map();
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    const type = loadJson(join(dir, file));
    out.set(type.name, type);
  }
  return out;
}

export function loadContracts(base = root) {
  const dir = join(base, 'contracts/api/components');
  const out = new Map();
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    out.set(file.replace(/\.json$/, ''), loadJson(join(dir, file)));
  }
  return out;
}

export function loadFixtures(base = root) {
  const dir = join(base, FIXTURE_DIR);
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(FIXTURE_SUFFIX)) continue;
    out.set(file.slice(0, -FIXTURE_SUFFIX.length), loadJson(join(dir, file)));
  }
  return out;
}

export function coverageProblems(contracts, fixtures) {
  const problems = [];
  if (contracts.size === 0)
    problems.push('found 0 contracts in contracts/api/components — an empty result set is a failure, not a clean pass; check the discovery path');
  if (fixtures.size === 0)
    problems.push(`found 0 fixtures in ${FIXTURE_DIR} — an empty result set is a failure, not a clean pass; check the discovery path`);
  for (const name of contracts.keys())
    if (!fixtures.has(name)) problems.push(`${name}: contracted but ${FIXTURE_DIR}/${name}${FIXTURE_SUFFIX} does not exist, so it can have no playground`);
  for (const name of fixtures.keys())
    if (!contracts.has(name)) problems.push(`${name}${FIXTURE_SUFFIX}: no contract named ${name}, so the fixture seeds nothing`);
  return problems;
}

export function valueProblems(where, spec, value, types) {
  const kind = spec.form;
  if (kind === 'primitive') {
    return typeof value === spec.type ? [] : [`${where}: declares ${spec.type} and the fixture holds ${typeof value}`];
  }
  if (kind === 'enum') {
    const values = types.get(spec.type)?.values ?? [];
    return values.includes(value) ? [] : [`${where}: ${JSON.stringify(value)} is not one of ${spec.type}'s ${JSON.stringify(values)}`];
  }
  if (kind === 'array') {
    if (!Array.isArray(value)) return [`${where}: declares an array and the fixture holds ${typeof value}`];
    if (spec.of === 'string' || spec.of === 'number') {
      return value.flatMap((item, i) => (typeof item === spec.of ? [] : [`${where}[${i}]: declares ${spec.of} and the fixture holds ${typeof item}`]));
    }
    return value.flatMap((item, i) => objectProblems(`${where}[${i}]`, spec.of, item, types));
  }
  if (kind === 'object') return objectProblems(where, spec.type, value, types);
  if (kind === 'functionInput') {
    return typeof value === 'string' ? [] : [`${where}: a functionInput is chosen by name and the fixture holds ${typeof value}`];
  }
  return [`${where}: form ${kind} takes no seed`];
}

export function objectProblems(where, typeName, value, types) {
  const type = types.get(typeName);
  if (!type) return [`${where}: no type named ${typeName} is declared in contracts/api/types`];
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return [`${where}: declares ${typeName} and the fixture holds ${Array.isArray(value) ? 'an array' : typeof value}`];
  const fields = type.fields ?? {};
  const problems = [];
  for (const [key, held] of Object.entries(value)) {
    if (!(key in fields)) { problems.push(`${where}.${key}: ${typeName} declares no such field`); continue; }
    problems.push(...valueProblems(`${where}.${key}`, fields[key], held, types));
  }
  for (const [key, field] of Object.entries(fields))
    if (field.required && !(key in value)) problems.push(`${where}: ${typeName}.${key} is required and the fixture omits it`);
  return problems;
}

export function seedProblems(name, contract, fixture, types) {
  const api = contract.api ?? {};
  const seed = fixture.seed ?? {};
  const problems = [];
  for (const [member, value] of Object.entries(seed)) {
    const spec = api[member];
    if (!spec) { problems.push(`${name}.seed.${member}: the contract declares no such member`); continue; }
    if (!SEEDABLE.has(spec.form)) { problems.push(`${name}.seed.${member}: form ${spec.form} is not seeded here`); continue; }
    problems.push(...valueProblems(`${name}.seed.${member}`, spec, value, types));
  }
  for (const [member, spec] of Object.entries(api)) {
    if (spec.form === 'slot' || spec.form === 'event') continue;
    if (spec.required && !('default' in spec) && !(member in seed))
      problems.push(`${name}.seed: ${member} is required and carries no default, so the fixture has to seed it`);
  }
  return problems;
}

export function nodeProblems(where, node, contracts, types, { allowSubject }) {
  if (node === SUBJECT) {
    return allowSubject ? [] : [`${where}: "${SUBJECT}" marks where the component under test goes and belongs in a host, nowhere else`];
  }
  if (node === null || typeof node !== 'object' || Array.isArray(node))
    return [`${where}: a node is "${SUBJECT}", a text node or a component node, and this is ${Array.isArray(node) ? 'an array' : typeof node}`];

  if (typeof node.text === 'string') {
    const unknown = Object.keys(node).filter((k) => !['text', 'element', 'attrs'].includes(k));
    return unknown.map((k) => `${where}: a text node carries text, element and attrs, never ${k}`);
  }
  if (typeof node.element === 'string') {
    const unknown = Object.keys(node).filter((k) => !['element', 'attrs', 'text'].includes(k));
    return unknown.map((k) => `${where}: an element node carries element, attrs and text, never ${k}`);
  }
  if (typeof node.component !== 'string')
    return [`${where}: a node names neither text, element nor component`];

  const contract = contracts.get(node.component);
  if (!contract) return [`${where}: no component named ${node.component} is contracted`];
  const api = contract.api ?? {};
  const problems = [];
  for (const [member, value] of Object.entries(node.members ?? {})) {
    const spec = api[member];
    if (!spec) { problems.push(`${where}.${member}: ${node.component} declares no such member`); continue; }
    if (!SEEDABLE.has(spec.form)) { problems.push(`${where}.${member}: form ${spec.form} takes no literal here`); continue; }
    problems.push(...valueProblems(`${where}.${member}`, spec, value, types));
  }
  for (const [member, spec] of Object.entries(api)) {
    if (spec.required && spec.form !== 'slot' && !('default' in spec) && !(member in (node.members ?? {})))
      problems.push(`${where}: ${node.component}.${member} is required and this node omits it`);
  }
  for (const [slot, list] of Object.entries(node.slots ?? {})) {
    if (api[slot]?.form !== 'slot') { problems.push(`${where}.slots.${slot}: ${node.component} declares no such slot`); continue; }
    problems.push(...listProblems(`${where}.slots.${slot}`, list, contracts, types, { allowSubject }));
  }
  return problems;
}

export function listProblems(where, list, contracts, types, options) {
  if (!Array.isArray(list)) return [`${where}: a slot holds a list of nodes and this is ${typeof list}`];
  return list.flatMap((node, i) => nodeProblems(`${where}[${i}]`, node, contracts, types, options));
}

export function slotProblems(name, contract, fixture, contracts, types) {
  const api = contract.api ?? {};
  const problems = [];
  for (const [slot, list] of Object.entries(fixture.slots ?? {})) {
    if (api[slot]?.form !== 'slot') { problems.push(`${name}.slots.${slot}: the contract declares no such slot`); continue; }
    problems.push(...listProblems(`${name}.slots.${slot}`, list, contracts, types, { allowSubject: false }));
  }
  for (const [member, spec] of Object.entries(api))
    if (spec.form === 'slot' && spec.required && !(member in (fixture.slots ?? {})))
      problems.push(`${name}.slots: ${member} is a required slot, so the fixture has to fill it`);
  return problems;
}

export function knobTarget(contract, target) {
  const [member, field] = String(target).split('.');
  const spec = contract.api?.[member];
  if (!spec) return { problem: `names ${member}, which the contract does not declare` };
  if (field === undefined) return { spec };
  if (spec.form !== 'object') return { problem: `names ${member}.${field}, but ${member} is not an object` };
  return { spec: null, member, field, objectType: spec.type };
}

export function bindProblems(name, contract, fixture, types) {
  const api = contract.api ?? {};
  const problems = [];
  for (const [event, target] of Object.entries(fixture.bind ?? {})) {
    const spec = api[event];
    if (!spec || spec.form !== 'event') { problems.push(`${name}.bind.${event}: the contract declares no event called ${event}`); continue; }

    if (typeof target === 'string') {
      if (!spec.payload) { problems.push(`${name}.bind.${event}: ${event} carries no payload, so it has nothing to write into ${target}`); continue; }
      const found = knobTarget(contract, target);
      if (found.problem) { problems.push(`${name}.bind.${event}: ${found.problem}`); continue; }
      const wanted = found.spec ?? (types.get(found.objectType)?.fields ?? {})[found.field];
      if (!wanted) { problems.push(`${name}.bind.${event}: ${found.objectType} declares no field called ${found.field}`); continue; }
      const carries = wanted.form === 'primitive' || wanted.form === 'enum' ? wanted.type : wanted.type ?? wanted.of;
      if (carries !== spec.payload)
        problems.push(`${name}.bind.${event}: the event carries ${spec.payload} and ${target} holds ${carries}`);
      continue;
    }

    if (target === null || typeof target !== 'object' || Array.isArray(target)) {
      problems.push(`${name}.bind.${event}: a target is a member name or a patch object, and this is ${typeof target}`);
      continue;
    }
    for (const [member, value] of Object.entries(target)) {
      const knob = api[member];
      if (!knob) { problems.push(`${name}.bind.${event}: patches ${member}, which the contract does not declare`); continue; }
      if (value !== null && typeof value === 'object' && '$delta' in value) {
        if (knob.form !== 'primitive' || knob.type !== 'number')
          problems.push(`${name}.bind.${event}: $delta steps a number and ${member} is ${knob.form}<${knob.type ?? ''}>`);
        else if (typeof value.$delta !== 'number')
          problems.push(`${name}.bind.${event}: $delta holds a number and this holds ${typeof value.$delta}`);
        continue;
      }
      problems.push(...valueProblems(`${name}.bind.${event}.${member}`, knob, value, types));
    }
  }
  return problems;
}

export function hostProblems(name, fixture, contracts, types) {
  if (!('host' in fixture) || fixture.host === null) return [];
  return nodeProblems(`${name}.host`, fixture.host, contracts, types, { allowSubject: true });
}

export function shapeProblems(name, fixture) {
  const problems = [];
  if (fixture.component !== name)
    problems.push(`${name}${FIXTURE_SUFFIX}: declares component "${fixture.component}", and the file name says ${name}`);
  const known = ['component', 'seed', 'slots', 'bind', 'host', 'note'];
  for (const key of Object.keys(fixture))
    if (!known.includes(key)) problems.push(`${name}${FIXTURE_SUFFIX}: carries ${key}, and a fixture holds ${known.join(', ')}`);
  return problems;
}

export function fixtureProblems(name, contract, fixture, contracts, types) {
  const problems = [
    ...shapeProblems(name, fixture),
    ...seedProblems(name, contract, fixture, types),
    ...slotProblems(name, contract, fixture, contracts, types),
    ...bindProblems(name, contract, fixture, types),
    ...hostProblems(name, fixture, contracts, types),
  ];
  if (problems.length > 0) return problems;
  try {
    playgroundModel(contract, fixture, types);
  } catch (err) {
    return [`${name}: ${err.message}`];
  }
  return [];
}

const CITING_TREES = LAYERS.map((layer) => join('frameworks', layer));
const PATH_LIKE = /frameworks\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+/g;
const PAGE_LIKE = /\b[A-Za-z][A-Za-z0-9]*\.(?:card|demo)\.(?:html|json|entry\.tsx|entry\.ts)\b/g;

export function basenameIndex(base = root) {
  const seen = new Set();
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir).sort()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'build' || entry === 'vendor') continue;
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else seen.add(entry);
    }
  };
  walk(join(base, 'frameworks'));
  return seen;
}

export function* citingFiles(base = root) {
  const walk = function* (dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir).sort()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'build' || entry === 'vendor') continue;
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) { yield* walk(path); continue; }
      if (entry.endsWith('.prompt.md') || entry === 'README.md') yield path;
    }
  };
  for (const tree of CITING_TREES) yield* walk(join(base, tree));
}

export function citationProblems(base = root, files = citingFiles(base), names = basenameIndex(base)) {
  const problems = [];
  for (const path of files) {
    const rel = path.slice(base.length + 1);
    for (const [line, text] of readFileSync(path, 'utf8').split('\n').entries()) {
      for (const cited of text.match(PATH_LIKE) ?? []) {
        const cleaned = cited.replace(/[.,;:)]+$/, '');
        if (cleaned.includes('.generated.')) continue;
        if (existsSync(join(base, cleaned))) continue;
        problems.push(`${rel}:${line + 1}: cites ${cleaned}, and nothing is there`);
      }
      for (const cited of text.match(PAGE_LIKE) ?? []) {
        if (cited.includes('.generated.') || names.has(cited)) continue;
        problems.push(`${rel}:${line + 1}: names ${cited}, and no file under frameworks/ is called that`);
      }
    }
  }
  return problems;
}

function main() {
  const contracts = loadContracts();
  const fixtures = loadFixtures();
  const types = loadTypes();

  const problems = coverageProblems(contracts, fixtures);
  if (problems.length === 0) {
    for (const [name, contract] of contracts)
      problems.push(...fixtureProblems(name, contract, fixtures.get(name), contracts, types));
  }
  problems.push(...citationProblems());

  if (problems.length > 0) {
    console.error(`check-playgrounds: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    `check-playgrounds: ${fixtures.size} fixture(s) seed every contracted member a contract cannot invent, `
    + 'and every path cited from a layer exists',
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
