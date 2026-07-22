/* The DOM-generic half of the behaviour compliance layer: given one element and
 * one of a pattern's requirement keys, decide whether that element meets it.
 *
 * Three return values, and the third is the point. `true` and `false` are a
 * verdict; `null` means "no single element can decide this" — focus behaviour,
 * key handling, and the auto-dismiss claim are behaviours, not attributes, and
 * a suite must assert them by acting on the tree rather than by reading it.
 * A future compliance gate holds every suite to that: a requirement whose
 * evaluate() is null must be named in a behavioural test or the gate fails.
 *
 * Why this file is DOM-generic rather than DOM-typed: it is consumed from three
 * runtimes — bun+happy-dom on the React side, bun+happy-dom under Angular's
 * TestBed, and plain node in its own test suite, which has no DOM at all. It
 * therefore touches exactly three members: `tagName`, `getAttribute`,
 * `hasAttribute`. Anything richer (querySelector, matches, closest) belongs to
 * the caller, which knows its own tree.
 *
 * Why a real DOM at all, rather than the text scan the spec proposed: a text
 * scan was built and measured against the whole tree before this file existed.
 * It reported 60 of 118 true "claimed met" requirements as unmet (native <button>
 * satisfies roles.element and keyboard.Space while leaving nothing to grep), and
 * wrongly retired 18 of 94 live exceptions (an attribute on the wrong element, in
 * three of four branches, or behind a ternary reads identically to a correct one).
 * The DOM resolves all three: an implicit role is a role, an assertion names its
 * element, and a suite renders every branch.
 */

/** Implicit ARIA roles, tag -> role, for the tags Arena's components actually
 *  render. Deliberately not exhaustive: an unlisted tag returns null, which
 *  reads as "no role", which is the safe direction — it can fail a true claim
 *  loudly, never pass a false one silently. Extend it when a component needs it.
 *  @type {Record<string, string>} */
export const IMPLICIT_ROLE = {
  A: 'link',
  ARTICLE: 'article',
  ASIDE: 'complementary',
  BUTTON: 'button',
  DIALOG: 'dialog',
  FIELDSET: 'group',
  FIGURE: 'figure',
  FOOTER: 'contentinfo',
  H1: 'heading', H2: 'heading', H3: 'heading', H4: 'heading', H5: 'heading', H6: 'heading',
  HEADER: 'banner',
  IMG: 'img',
  LI: 'listitem',
  MAIN: 'main',
  NAV: 'navigation',
  OL: 'list',
  OUTPUT: 'status',
  PROGRESS: 'progressbar',
  SELECT: 'combobox',
  TABLE: 'table',
  TBODY: 'rowgroup',
  TD: 'cell',
  TEXTAREA: 'textbox',
  TH: 'columnheader',
  TR: 'row',
  UL: 'list',
};

/** `<input>` has no single implicit role; it depends on `type`. */
const INPUT_ROLE = {
  button: 'button', submit: 'button', reset: 'button',
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  search: 'searchbox',
};

/** Tags that take focus with no `tabindex` of their own. */
const NATIVELY_FOCUSABLE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

/** The element's ARIA role: explicit if authored, else implicit, else null.
 *  @param {{tagName: string, getAttribute: (n: string) => string | null}} el */
export function roleOf(el) {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit.trim().split(/\s+/)[0];
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return INPUT_ROLE[type] ?? 'textbox';
  }
  // A <section> is only a region when it is named; unnamed it exposes no role.
  if (tag === 'SECTION') return hasAccessibleName(el) ? 'region' : null;
  return IMPLICIT_ROLE[tag] ?? null;
}

/** Whether the element carries an ARIA name. Content-derived names (a <button>'s
 *  own text) are deliberately not credited: every roles.label requirement in
 *  behaviour/patterns/ asks for an explicit one, and crediting text content would
 *  pass Dialog, whose exception says plainly that its title has no id and the
 *  dialog element carries neither attribute.
 *  @param {{getAttribute: (n: string) => string | null}} el */
export function hasAccessibleName(el) {
  return Boolean(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
}

/** Whether the element can take keyboard focus. Not a claim about focus *order*
 *  — happy-dom does not implement sequential navigation and this layer never
 *  asserts it.
 *  @param {{tagName: string, getAttribute: (n: string) => string | null, hasAttribute: (n: string) => boolean}} el */
export function isFocusable(el) {
  if (el.hasAttribute('disabled')) return false;
  const ti = el.getAttribute('tabindex');
  if (ti !== null) return Number(ti) >= 0;
  return NATIVELY_FOCUSABLE.has(el.tagName.toUpperCase());
}

/** Requirement key -> the ARIA attribute that satisfies it, for the requirements
 *  that are pure attribute presence. */
const ATTRIBUTE_FOR = {
  'roles.aria-modal': 'aria-modal',
  'roles.haspopup': 'aria-haspopup',
  'roles.expanded': 'aria-expanded',
  'roles.controls': 'aria-controls',
  'roles.activedescendant': 'aria-activedescendant',
  'roles.describedby': 'aria-describedby',
  'states.checked': 'aria-checked',
  'states.selected': 'aria-selected',
  'states.multiselectable': 'aria-multiselectable',
  'states.posinset': 'aria-posinset',
  'states.busy': 'aria-busy',
  'states.required': 'aria-required',
  'states.readonly': 'aria-readonly',
};

/** Requirement keys naming a role the element itself must expose. `roles.element`
 *  is excluded because its required role comes from the pattern's value, not the key. */
const ROLE_NAMED_BY_KEY = {
  'roles.grid': 'grid',
  'roles.row': 'row',
  'roles.cell': ['gridcell', 'cell', 'columnheader', 'rowheader'],
  'roles.feed': 'feed',
  'roles.article': 'article',
  'roles.tablist': 'tablist',
  'roles.tab': 'tab',
  'roles.tabpanel': 'tabpanel',
  'roles.option': 'option',
  'roles.group': ['group', 'radiogroup'],
  'roles.item': ['radio', 'menuitem', 'option'],
  'roles.graphic': 'img',
};

/** The requirement keys evaluate() can decide from one element. Everything else
 *  returns null and must be asserted behaviourally. @type {Set<string>} */
export const DECIDABLE = new Set([
  'roles.element', 'roles.label',
  ...Object.keys(ATTRIBUTE_FOR),
  ...Object.keys(ROLE_NAMED_BY_KEY),
  'states.disabled', 'states.multiline',
  'live.politeness',
]);

/** Decide one requirement against one element.
 *  @param {object} el
 *  @param {string} key dotted requirement key, e.g. 'roles.element'
 *  @param {unknown} value the pattern's declared value for that key
 *  @returns {true | false | null} null = undecidable from this element alone */
export function evaluate(el, key, value) {
  if (key === 'roles.element') return roleOf(el) === String(value);
  if (key === 'roles.label') return hasAccessibleName(el);

  const attr = ATTRIBUTE_FOR[key];
  if (attr) return el.getAttribute(attr) !== null;

  const wanted = ROLE_NAMED_BY_KEY[key];
  if (wanted) {
    const actual = roleOf(el);
    return Array.isArray(wanted) ? wanted.includes(actual) : actual === wanted;
  }

  if (key === 'states.disabled') {
    return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') !== null;
  }
  if (key === 'states.multiline') {
    return el.tagName.toUpperCase() === 'TEXTAREA' || el.getAttribute('aria-multiline') !== null;
  }
  if (key === 'live.politeness') {
    // role=status and role=alert carry an implicit live region; an explicit
    // aria-live satisfies it directly.
    if (el.getAttribute('aria-live') !== null) return true;
    return ['status', 'alert', 'log'].includes(roleOf(el));
  }

  // focus.*, keyboard.*, content.*, alternative.* — behaviours, not attributes.
  return null;
}

/**
 * Compare one component's rendered subject elements against its binding, in both
 * directions, and return one message per disagreement.
 *
 * This is the whole assertion, and it lives here — framework-agnostic, no fs, no
 * DOM beyond what evaluate() touches — so that React's and Angular's suites share
 * it rather than each carrying a copy. Two copies of a comparison is two places
 * for the rule to drift, and this rule is the layer's only real guarantee.
 *
 * Both directions in one statement, because the asymmetry is what made the
 * contract layer unverifiable: a binding could overclaim (a requirement not
 * excepted that is not met) or underclaim (an exception kept after the source was
 * fixed), and only the second is the property the layer was modelled on. Checking
 * one and not the other is how EXEMPT maps rot.
 *
 * `subjects` exists because a text scan cannot tell which element carries an
 * attribute and a human can. Menu.jsx puts aria-haspopup on a wrapping <span>
 * rather than the focusable trigger; judged against the wrapper the exception
 * looks stale, judged against the trigger it is true. Naming the element the
 * requirement is *about* is stated once per suite rather than inferred forever.
 *
 * @param {object} o
 * @param {{name: string, requires: Record<string, unknown>}} o.pattern
 * @param {{pattern: string, exceptions?: {requirement: string, reason: string}[]}} o.binding
 * @param {Record<string, object|null>} [o.subjects] requirement key -> the element that must carry it
 * @param {object|null} [o.fallback] the element used for any requirement not named in `subjects`
 * @param {string[]} [o.behavioural] requirement keys the caller asserts by acting on
 *   the tree rather than by reading it. Every undecidable requirement must be listed
 *   or this reports it — silence about an unverifiable claim is what this layer exists
 *   to remove.
 * @returns {string[]} one message per problem, empty when clean
 */
export function comparePattern({ pattern, binding, subjects = {}, fallback = null, behavioural = [] }) {
  const excepted = new Map((binding.exceptions ?? []).map((e) => [e.requirement, e.reason]));
  const declared = new Set(behavioural);
  const used = new Set();
  const problems = [];

  for (const [key, value] of Object.entries(pattern.requires)) {
    const el = key in subjects ? subjects[key] : fallback;
    if (!el) {
      problems.push(`${key}: no subject element — nothing was rendered, or the selector matched nothing.`);
      continue;
    }
    const verdict = evaluate(el, key, value);

    if (verdict === null) {
      if (declared.has(key)) { used.add(key); continue; }
      problems.push(
        `${key}: undecidable from the DOM and not declared behavioural. ` +
        'Assert it by acting on the tree and list it in `behavioural`, or explain why it cannot be asserted at all.',
      );
      continue;
    }

    const hasException = excepted.has(key);
    if (verdict && hasException) {
      problems.push(
        `${key}: STALE EXCEPTION — met in the rendered DOM, but the binding still excepts it.\n` +
        `      reason on file: ${excepted.get(key)}\n` +
        '      Delete the exception, or name a subject if the exception is about a different element.',
      );
    } else if (!verdict && !hasException) {
      problems.push(
        `${key}: OVERCLAIM — the binding declares no exception, but the rendered DOM does not meet it.\n` +
        `      pattern requires: ${JSON.stringify(value)}`,
      );
    }
  }

  for (const key of declared) {
    if (used.has(key)) continue;
    problems.push(
      `${key}: declared behavioural but never reached. ` +
      'Either the pattern no longer requires it, or it is now decidable from the DOM — remove it from `behavioural`.',
    );
  }
  return problems;
}
