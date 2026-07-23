/* check:api — Arena's third contract, the API capability contract.
 *
 * api/components/<Name>.json states, once and neutrally, the members that
 * component's API presents. Every layer implementing it implements exactly
 * those members -- same name, same form, not fewer and not more. This gate
 * makes five assertions:
 *
 *   1. COVERAGE.        Every contract names a component at least one layer
 *                       implements. The contract's existence IS the coverage
 *                       claim, so no separate record can go stale against it.
 *   2. FORM.            No member uses anything outside the seven forms.
 *   3. AGREEMENT.       Every implementing layer declares exactly the contract's
 *                       members, same name, same form, same required-ness. An
 *                       OPTIONAL member is still a declared member: `required:
 *                       false` governs whether a CONSUMER must supply it, never
 *                       whether a LAYER must offer it. Required-ness itself is
 *                       compared only for the four inbound non-slot forms
 *                       (primitive, enum, object, array) -- a slot's and an
 *                       event's required-ness is not comparable across layers,
 *                       because neither platform pair can express it: Angular's
 *                       `<ng-content>` cannot declare projected content
 *                       mandatory, and an outbound event is never "required" on
 *                       either platform. See the comment beside the comparison
 *                       in compareSurface(). A member name declared TWICE in one
 *                       layer's own surface is reported too -- a duplicate is
 *                       "not fewer, not more" failing silently otherwise, the
 *                       shape a slot mentioned in a doc comment as well as the
 *                       real template exposed.
 *   4. DERIVED RULES.   R1, R4 and R5, against the declared types. R1 also
 *                       covers a field's OWN reference: an object field naming
 *                       an enum checks that the named type is declared and is
 *                       itself an enum, not only that primitives are spelled
 *                       correctly.
 *   5. GENERATED DRIFT. The committed api.generated.* match api/types/.
 *
 * THERE IS NO EXCEPTION MAP, and that is not an oversight. Every other record in
 * this repository -- EXEMPT, EXCLUDED, COVERED -- exists because the thing it
 * excuses is a difference someone may reasonably want. An API divergence is a
 * defect; a place to write one down is the whole thing this layer removes.
 *
 * TWO OF THE FIVE RULES ARE NOT ASSERTED HERE, and pretending otherwise would be
 * worse than saying so. R2 ("who draws decides data versus slot") is a fact about
 * markup ownership, and R3 ("a parameterised slot fills, never replaces") is a
 * fact about the rendered tree. Neither is visible in a member list. They are
 * authoring rules the audit protocol applies, recorded in api/README.md and in
 * CLAUDE.md's Known debt. A green run means R1, R4 and R5 hold.
 *
 * COVERAGE IS PARTIAL BY DESIGN and grows one component at a time, the same
 * charter COVERED carries in check-compliance.mjs. This gate never demands
 * totality -- only that every contract in the directory is true of every layer
 * implementing it. A green run is a claim about the contracted components and
 * says nothing about the rest, and -- being orthogonal to behaviour -- nothing
 * about what any of them does either.
 *
 *   bun scripts/check-api.mjs   -> exit 0 if every contract holds, 1 otherwise
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildApiModules } from './build-api-types.mjs';
import { reactSurface, angularSurface, UnrecognisedShape } from './lib/api-surface.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The six encoded `form` values. `array` covers both array forms, discriminated
 *  by `of` -- a representation choice, not a narrowing of the vocabulary. */
const FORMS = new Set(['primitive', 'enum', 'object', 'array', 'slot', 'event']);
const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean']);

/** React groups, the same list check-behaviour.mjs walks. */
const REACT_GROUPS = ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation'];

/** "AppLogo" -> "app-logo". Pascal -> kebab is safe in this direction and only
 *  this one; the inverse is not, which is why an Angular behaviour binding names
 *  its React counterpart rather than deriving it. */
export function kebab(pascal) {
  return pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** A contract member's name as one layer binds it. The contract governs the
 *  member surface, never the syntax a platform expresses it in. See the binding
 *  table in api/README.md -- this function IS that table. */
export function bindingName(name, form, layer) {
  if (layer !== 'react') return name;
  if (form === 'slot') return name === 'content' ? 'children' : name;
  if (form === 'event') return `on${name[0].toUpperCase()}${name.slice(1)}`;
  return name;
}

/** @returns {string[]} problems */
export function validateTypes(types) {
  const problems = [];
  const seen = new Set();
  /* Built from ALL types up front, not filled in as the loop below reaches
   * each one -- a field may name an enum declared later in file-name order
   * (loadTypes()'s own contract is alphabetical-by-filename, not
   * dependency order), and this must resolve either way. */
  const kindByName = new Map();
  for (const type of types) {
    if (type.name) kindByName.set(type.name, type.kind);
  }
  for (const type of types) {
    if (!type.name) { problems.push('api/types: a type has no name'); continue; }
    if (seen.has(type.name)) problems.push(`${type.name}: declared twice`);
    seen.add(type.name);
    if (type.kind === 'enum') {
      if (!Array.isArray(type.values) || !type.values.length) {
        problems.push(`${type.name}: an enum is a closed set and this declares no values`);
      }
      continue;
    }
    if (type.kind !== 'object') { problems.push(`${type.name}: unknown kind "${type.kind}"`); continue; }
    for (const [field, spec] of Object.entries(type.fields ?? {})) {
      if (spec.form === 'primitive') {
        if (!PRIMITIVE_TYPES.has(spec.type)) problems.push(`${type.name}.${field}: "${spec.type}" is not a primitive`);
      } else if (spec.form === 'enum') {
        /* An object field's enum type name was previously never checked
         * against the declared type list -- {form:'enum', type:'Nonexistent'}
         * would emit an unresolvable TypeScript reference into BOTH generated
         * modules (renderApiModule emits `field.type` verbatim, undeclared or
         * not). Caught downstream today only because
         * frameworks/angular/index.ts re-exports ./api.generated and
         * tsconfig.check.json pulls it in -- luck, not design; React's own
         * .d.ts has no such backstop at all. */
        if (!kindByName.has(spec.type)) {
          problems.push(`${type.name}.${field}: names enum type "${spec.type}", which api/types/ does not declare`);
        } else if (kindByName.get(spec.type) !== 'enum') {
          problems.push(`${type.name}.${field}: "${spec.type}" is a ${kindByName.get(spec.type)}, used where an enum belongs`);
        }
      } else {
        problems.push(`${type.name}.${field}: form "${spec.form}" is not allowed inside a predefined object — R1, an object is pure data`);
      }
    }
  }
  return problems;
}

/** @param {Map<string,'enum'|'object'>} typeNames @returns {string[]} problems */
export function validateContract(contract, typeNames) {
  const problems = [];
  const where = contract.component ?? '(unnamed)';
  const declared = (name, kind) => {
    if (!typeNames.has(name)) return `${where}: names type "${name}", which api/types/ does not declare`;
    if (typeNames.get(name) !== kind) return `${where}: "${name}" is a ${typeNames.get(name)}, used where a ${kind} belongs`;
    return null;
  };
  for (const [member, spec] of Object.entries(contract.api ?? {})) {
    if (!FORMS.has(spec.form)) {
      problems.push(`${where}.${member}: form "${spec.form}" is none of the seven — see api/README.md`);
      continue;
    }
    if (spec.form === 'primitive' && !PRIMITIVE_TYPES.has(spec.type)) {
      problems.push(`${where}.${member}: "${spec.type}" is not a primitive`);
    }
    if (spec.form === 'enum') problems.push(...[declared(spec.type, 'enum')].filter(Boolean));
    if (spec.form === 'object') problems.push(...[declared(spec.type, 'object')].filter(Boolean));
    if (spec.form === 'array' && !PRIMITIVE_TYPES.has(spec.of)) {
      problems.push(...[declared(spec.of, 'object')].filter(Boolean));
    }
    if (spec.form === 'event' && spec.payload) {
      problems.push(...[declared(spec.payload, 'object')].filter(Boolean));
    }
    for (const [param, type] of Object.entries(spec.params ?? {})) {
      if (PRIMITIVE_TYPES.has(type)) continue;
      if (!typeNames.has(type)) problems.push(`${where}.${member}: slot parameter "${param}" names undeclared type "${type}"`);
    }
  }
  return problems;
}

/** Assertions 2, 3 and the layer half of 4, for one layer of one component.
 *  @param {Map<string,object>} [types] every declared api/types/ type, keyed
 *  by name, resolved by the CALLER (main() reads the filesystem once; this
 *  function stays pure and string-in/data-out, same as every other export
 *  here). Needed only to resolve an inline literal union's VALUES against a
 *  contract enum member -- see the comment beside that comparison below.
 *  @returns {string[]} problems */
export function compareSurface(contract, members, layer, types = new Map()) {
  const problems = [];
  const where = `${layer}/${contract.component}`;

  const expected = new Map();
  const collided = new Set();
  for (const [name, spec] of Object.entries(contract.api ?? {})) {
    const bound = bindingName(name, spec.form, layer);
    if (expected.has(bound)) {
      /* Two distinct contract members bound to the same name in this layer --
       * a contract-authoring error, not a layer defect. The first spec stays
       * in `expected`; the collision problem below is what matters, and
       * neither member is compared against `members` afterwards -- with two
       * contract members claiming one bound name, there is no way to know
       * which one a layer member matching that name is meant to satisfy, so
       * verification of either is not possible while they collide. */
      problems.push(
        `${where}: contract members "${expected.get(bound).member}" and "${name}" both bind to "${bound}" `
        + `in ${layer} -- rename one; verification of either against the layer is not possible while they collide`,
      );
      collided.add(bound);
      continue;
    }
    expected.set(bound, { member: name, ...spec });
  }

  const seen = new Set();
  const rawSeen = new Set();
  for (const m of members) {
    /* Duplicate detection is on the RAW member name, before any contract
     * binding is consulted -- two identical `icon` slots (stat-card.ts's own
     * doc comment quoting the real template, before the templateSlots() fix
     * above) must be caught even though both bind to a name the contract
     * does declare, which is exactly the shape that made `seen.add()` alone
     * silently swallow the second one: a Set add is a no-op on a name
     * already present, so nothing distinguished "declared once, matched"
     * from "declared twice, matched twice". This still falls through to
     * every check below for the duplicate itself -- R4/R5/agreement judge a
     * member on its own regardless of how many times its name repeats. */
    if (rawSeen.has(m.name)) {
      problems.push(`${where}.${m.name}: declared twice in this layer's own surface -- a slot mentioned in a doc comment as well as the real template is the known case`);
    } else {
      rawSeen.add(m.name);
    }
    if (m.form === 'platform') {
      problems.push(`${where}.${m.name}: "${m.type}" is a platform type and none of the seven forms — R4`);
      continue;
    }
    if (m.form === 'union') {
      problems.push(`${where}.${m.name}: a union between forms (${m.parts.join(' | ')}) — R5, a member is one form`);
      continue;
    }
    if (m.platformPayload) {
      problems.push(`${where}.${m.name}: the event payload "${m.payload}" is a platform type — R4`);
      continue;
    }
    /* Only NOW, after a member's own form validity (R4, R5) has already been
     * judged unconditionally, does a collided bound name stop the check. A
     * collision means two distinct contract members claim this one bound
     * name, so there is no way to know which one this layer member is meant
     * to satisfy -- the AGREEMENT comparison below is impossible while they
     * collide. That is not true of the checks above: R4 and R5 judge a
     * member entirely on its own, with no reference to any contract spec, so
     * they must still fire even at a collided name. */
    if (collided.has(m.name)) { seen.add(m.name); continue; }
    const spec = expected.get(m.name);
    if (!spec) {
      problems.push(`${where}.${m.name}: declared, but the contract does not name it — add it to the contract or remove it from the layer`);
      continue;
    }
    seen.add(m.name);
    /* A `named` form is the reader saying "an identifier I cannot resolve".
     * It resolves ONLY against a contract `enum` or `object` member -- those
     * are the two forms a declared type name can carry; the contract's own
     * type name is what decides which, and validateContract already proved
     * that name is declared and of the right kind. Against any other
     * contract form (primitive, slot, array, event) a bare type reference
     * cannot satisfy it, so it is a mismatch like any other form disagreement. */
    if (m.form === 'named') {
      if (spec.form !== 'enum' && spec.form !== 'object') {
        problems.push(`${where}.${m.name}: declared as named type "${m.type}", contract says ${spec.form}`);
        continue;
      }
    } else if (m.form !== spec.form) {
      problems.push(`${where}.${m.name}: declared as ${m.form}, contract says ${spec.form}`);
      continue;
    }
    /* Required-ness is contracted, and compared, for the four inbound
     * non-slot forms only -- `slot` and `event` are excluded because neither
     * platform pair can express the concept, not because a divergence there
     * is excused. A required SLOT is not comparable: React can express one
     * (`children: React.ReactNode`, no `?`), but Angular's `<ng-content>` has
     * no way to declare projected content mandatory -- `templateSlots()`
     * always reports `required: false`, so comparing would fail every
     * contract that declares a required slot against Angular forever, for a
     * platform syntax limit and not a real divergence. An EVENT's
     * required-ness is not comparable either: an outbound member is never
     * "required" on either platform -- a consumer is always free not to
     * listen, React binds it as an optional function prop and Angular as an
     * `output()`, and neither has a notion of a mandatory listener. Both
     * sides are normalised to a boolean before comparing, so a contract with
     * no `required` key (optional) reads the same as a layer's explicit
     * `required: false`. This runs only once the form itself already agrees
     * (the branch above already `continue`d otherwise), so a member whose
     * form is wrong reports that, not a second problem about the same
     * defect. */
    if (spec.form === 'primitive' || spec.form === 'enum' || spec.form === 'object' || spec.form === 'array') {
      const contractRequired = Boolean(spec.required);
      const layerRequired = Boolean(m.required);
      if (contractRequired !== layerRequired) {
        problems.push(
          `${where}.${m.name}: contract says ${contractRequired ? 'required' : 'optional'}, `
          + `${layer} declares it ${layerRequired ? 'required' : 'optional'}`,
        );
      }
    }
    if (spec.form === 'array' && m.of !== spec.of) {
      problems.push(`${where}.${m.name}: array of ${m.of}, contract says array of ${spec.of}`);
    }
    if (spec.form === 'event' && (m.payload ?? null) !== (spec.payload ?? null)) {
      problems.push(`${where}.${m.name}: payload ${m.payload ?? 'none'}, contract says ${spec.payload ?? 'none'}`);
    }
    if ((spec.form === 'enum' || spec.form === 'object') && m.type && m.type !== spec.type) {
      problems.push(`${where}.${m.name}: typed ${m.type}, contract says ${spec.type}`);
    }
    /* An INLINE literal union (`'sm' | 'md'`) classifies as {form:'enum',
     * values:[...]} with no `type` -- classify() has nothing to name it
     * with, unlike a named identifier (`LogoSize`), which comes back as
     * `form: 'named'` and is resolved above. That absence of `m.type` is
     * exactly why the check above never ran for this shape: its guard is
     * `m.type &&`, so a layer spelling the contract's enum as an inline
     * union always matched on FORM alone, with its actual values compared
     * to nothing. Resolve the contract's own enum by name against `types`
     * (the caller's api/types/ map) and compare the two VALUE SETS,
     * membership only -- order carries no meaning in either union. */
    if (spec.form === 'enum' && m.form === 'enum' && Array.isArray(m.values)) {
      const declared = types.get(spec.type);
      if (declared?.kind === 'enum' && Array.isArray(declared.values)) {
        const layerSet = new Set(m.values);
        const contractSet = new Set(declared.values);
        const same = layerSet.size === contractSet.size && [...layerSet].every((v) => contractSet.has(v));
        if (!same) {
          problems.push(
            `${where}.${m.name}: inline union values [${m.values.join(', ')}] do not match `
            + `${spec.type}'s declared values [${declared.values.join(', ')}]`,
          );
        }
      }
    }
  }

  for (const [bound, spec] of expected) {
    if (seen.has(bound) || collided.has(bound)) continue;
    problems.push(`${where}: does not declare "${bound}" (contract member "${spec.member}", ${spec.form})`
      + (spec.required === false ? ' — an optional member is still a declared member' : ''));
  }
  return problems;
}

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

function reactPath(component) {
  for (const group of REACT_GROUPS) {
    const path = join(root, 'frameworks/react/components', group, `${component}.d.ts`);
    if (existsSync(path)) return path;
  }
  return null;
}

function angularPath(component) {
  const dir = kebab(component);
  const path = join(root, 'frameworks/angular/primitives', dir, `${dir}.ts`);
  return existsSync(path) ? path : null;
}

function main() {
  const problems = [];

  /* 5. Generated drift, first -- not because any later assertion depends on
   *    it (typeNames below is built straight from api/types/, never from the
   *    generated modules; the two read independent sources), but because a
   *    stale generated module is the problem most likely to explain every
   *    other one, so it should head the list. */
  for (const [path, expected] of buildApiModules()) {
    let actual;
    try { actual = readFileSync(join(root, path), 'utf8'); }
    catch { problems.push(`${path}: missing — run bun run build:api`); continue; }
    if (actual !== expected) problems.push(`${path}: stale — run bun run build:api`);
  }

  /* 4a. The type declarations themselves, R1 included. */
  const typeDir = join(root, 'api/types');
  const types = readdirSync(typeDir).filter((f) => f.endsWith('.json')).sort().map((f) => read(join(typeDir, f)));
  problems.push(...validateTypes(types));
  const typeNames = new Map(types.map((t) => [t.name, t.kind]));
  /* compareSurface's fourth parameter -- the FULL declared type (values
   * included, not just its kind), so it can resolve an inline literal
   * union's value set against the enum its contract member names. Built
   * here, once, from the same api/types/ read `typeNames` already uses --
   * compareSurface itself never touches the filesystem. */
  const typesByName = new Map(types.map((t) => [t.name, t]));

  const contractDir = join(root, 'api/components');
  const files = existsSync(contractDir) ? readdirSync(contractDir).filter((f) => f.endsWith('.json')).sort() : [];
  let layersChecked = 0;

  for (const file of files) {
    const contract = read(join(contractDir, file));
    problems.push(...validateContract(contract, typeNames));

    /* 1. Coverage, resolved structurally rather than from a list. */
    const react = reactPath(contract.component);
    const angular = angularPath(contract.component);
    if (!react && !angular) {
      problems.push(`${file}: names component "${contract.component}", which no layer implements`);
      continue;
    }

    /* 2, 3, 4b. Each implementing layer, and only those: a component in one
     *           layer only is absence, not divergence. */
    for (const [layer, path, readSurface, symbol] of [
      ['react', react, reactSurface, `${contract.component}Props`],
      ['angular', angular, angularSurface, contract.component],
    ]) {
      if (!path) continue;
      layersChecked += 1;
      let surface;
      try {
        surface = readSurface(readFileSync(path, 'utf8'), symbol);
      } catch (error) {
        if (!(error instanceof UnrecognisedShape)) throw error;
        problems.push(`${layer}/${contract.component}: the reader could not read this surface — ${error.message}`);
        continue;
      }
      for (const base of surface.heritage ?? []) {
        problems.push(`${layer}/${contract.component}: extends "${base}" — the {...rest} escape is none of the seven forms, R4`);
      }
      problems.push(...compareSurface(contract, surface.members, layer, typesByName));
    }
  }

  if (problems.length) {
    console.error(`check-api: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-api: ${files.length} contract(s) hold across ${layersChecked} layer implementation(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
