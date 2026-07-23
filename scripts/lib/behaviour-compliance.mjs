/* The DOM-generic half of the behaviour compliance layer: given one element and
 * one of a pattern's requirement keys, decide whether that element meets it.
 *
 * Three return values, and the third is the point. `true` and `false` are a
 * verdict; `null` means "no single element can decide this" — focus behaviour,
 * key handling, the auto-dismiss claim and every CONDITIONAL state are
 * behaviours, not attributes, and a suite must assert them by acting on the tree
 * rather than by reading it. `scripts/check-compliance.mjs` holds every suite to
 * that: a requirement whose evaluate() is null must be named in a behavioural
 * test or the gate fails.
 *
 * `null` is never a fallthrough. Every requirement key is in exactly one of two
 * exported sets — DECIDABLE or BEHAVIOURAL — and a key in neither throws. It used
 * to fall off the end of evaluate() and return null, which had a failure mode
 * worth naming because it is silent in both directions: a typo in a pattern file
 * ("states.chekced") returned null, comparePattern told the suite author to
 * declare it behavioural, the author did, and from then on the misspelt
 * requirement passed forever while the real one was never checked at all. A
 * throw turns that into a loud error at the only moment anyone is looking.
 *
 * Requirement semantics key off the requirement KEY and the PATTERN NAME, never
 * off the requirement's value. This is the correction that matters most in this
 * file. The values in behaviour/patterns/*.json are human prose written for a
 * reader — navigation's roles.element is a whole sentence ("navigation (native
 * nav, or role=navigation when nav cannot be used)"), and button's roles.label is
 * a list of three alternatives. The first implementation compared
 * `roleOf(el) === String(value)`, which made a real <nav> fail its own pattern
 * and reported false OVERCLAIMs against seven components that were correct
 * (SideNav, Button, Checkbox, Switch, IconButton, Tag, ThemeToggle). That is
 * worse than a missed defect: the cheapest way to silence a false OVERCLAIM is to
 * write a fabricated exception into the binding, which corrupts the exact debt
 * record this layer exists to keep honest and inverts the gate's meaning. The
 * prose stays prose; the machine reads ELEMENT_ROLE and LABEL_ACCEPTS_TEXT.
 *
 * Why this file is DOM-generic rather than DOM-typed: it is consumed from three
 * runtimes — bun+happy-dom on the React side, bun+happy-dom under Angular's
 * TestBed, and plain node in its own test suite, which has no DOM at all. It
 * therefore touches exactly four members: `tagName`, `getAttribute`,
 * `hasAttribute`, `textContent`. Anything richer (querySelector, matches,
 * closest) belongs to the caller, which knows its own tree.
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

/** Pattern name -> the ARIA role its `roles.element` requirement asks for.
 *
 *  This map exists because the requirement's own value cannot be used. Compare
 *  navigation's value — "navigation (native nav, or role=navigation when nav
 *  cannot be used)" — with dialog-modal's, which is the bare word "dialog". Both
 *  are correct prose for a human; only one happens to be a role token, and
 *  depending on that coincidence is what made a real <nav> fail.
 *
 *  It must cover every pattern carrying a `roles.element` requirement, and name
 *  no pattern that does not exist. Both directions are asserted in
 *  scripts/behaviour-compliance.test.mjs against the real files, so this map
 *  cannot silently drift from behaviour/patterns/.
 *  @type {Record<string, string>} */
export const ELEMENT_ROLE = {
  alert: 'alert',
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  'dialog-modal': 'dialog',
  listbox: 'listbox',
  'menu-button': 'button',   // the trigger is a button; the popup it owns is the menu
  navigation: 'navigation',
  status: 'status',
  switch: 'switch',
  textbox: 'textbox',
  toolbar: 'toolbar',
  tooltip: 'tooltip',
};

/** The patterns whose `roles.label` prose admits an element's own text content as
 *  its accessible name: "text content, aria-labelledby, or aria-label".
 *
 *  This is a whitelist rather than a blanket rule, and the blanket rule is the
 *  bug it prevents. dialog-modal's roles.label says "aria-labelledby or
 *  aria-label" and means it — Dialog's exception records that its title carries
 *  no id and the dialog element carries neither attribute. If text content were
 *  credited everywhere, that true exception would be reported STALE and deleted,
 *  and a real accessibility defect would leave the debt record.
 *
 *  Asserted against the real pattern files: every name here must have a
 *  roles.label value that actually mentions text content.
 *  @type {Set<string>} */
export const LABEL_ACCEPTS_TEXT = new Set(['button', 'checkbox', 'switch']);

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
  // Text content never names a section, hence the explicit `false`.
  if (tag === 'SECTION') return hasAccessibleName(el, false) ? 'region' : null;
  return IMPLICIT_ROLE[tag] ?? null;
}

/** Whether the element carries an accessible name.
 *
 *  `acceptsText` decides whether the element's own text content counts, and the
 *  caller must pass it deliberately — it defaults to false, the stricter answer,
 *  so a new call site cannot accidentally widen the rule. Only the patterns in
 *  LABEL_ACCEPTS_TEXT say text content is enough; see that map for why crediting
 *  it everywhere would wrongly retire Dialog's true exception.
 *  @param {{getAttribute: (n: string) => string | null, textContent?: string | null}} el
 *  @param {boolean} [acceptsText] */
export function hasAccessibleName(el, acceptsText = false) {
  if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return true;
  if (!acceptsText) return false;
  return Boolean((el.textContent ?? '').trim());
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
 *  that are pure, unconditional attribute presence.
 *
 *  Several keys were removed from this map and moved to BEHAVIOURAL, because
 *  their prose is conditional and presence is the wrong question — see that set. */
const ATTRIBUTE_FOR = {
  'roles.aria-modal': 'aria-modal',
  'roles.haspopup': 'aria-haspopup',
  'roles.expanded': 'aria-expanded',
  'roles.controls': 'aria-controls',
  'roles.activedescendant': 'aria-activedescendant',
  'roles.describedby': 'aria-describedby',
  'states.selected': 'aria-selected',
};

/** Requirement keys naming a role the element itself must expose. `roles.element`
 *  is excluded because its required role comes from ELEMENT_ROLE, keyed by the
 *  pattern, not from the key. */
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

/** The requirement keys evaluate() can decide from one element, derived from the
 *  maps above rather than restated. A hand-written second list is a second place
 *  for the rule to live, and it was already out of step with evaluate() once.
 *  @type {Set<string>} */
export const DECIDABLE = new Set([
  'roles.element',
  'roles.label',
  ...Object.keys(ATTRIBUTE_FOR),
  ...Object.keys(ROLE_NAMED_BY_KEY),
  'states.checked',
  'states.multiline',
  'live.politeness',
]);

/** The requirement keys that are genuinely behaviours rather than attributes, for
 *  which evaluate() returns null and a suite must assert by acting on the tree.
 *
 *  Two families and a tail. `focus.*` and `keyboard.*` are behaviours by nature.
 *  `content.noAutoDismiss` is a claim about the passage of time; `alternative.table`
 *  is a claim about a sibling subtree, outside the one-element surface.
 *
 *  The tail is the correction. Six CONDITIONAL states live here that a presence
 *  check used to answer wrongly, because their prose carries a "when": disabled is
 *  "aria-disabled set to true WHEN the action is unavailable", and likewise
 *  required, readonly, multiselectable, busy and posinset. A snapshot of one
 *  element cannot decide a conditional claim — an enabled <button> correctly
 *  carries no aria-disabled, and reading that as unmet produced
 *  "Button, enabled: states.disabled: OVERCLAIM" against a component doing exactly
 *  the right thing. Only a suite that renders the condition and then asserts can
 *  answer these, which is precisely what "behavioural" means here.
 *
 *  `states.checked` deliberately did NOT move: "aria-checked set to true, false,
 *  or mixed" is unconditional — a checkbox always has a checked state.
 *  @type {Set<string>} */
export const BEHAVIOURAL = new Set([
  // focus.*
  'focus.unaffected', 'focus.onOpen', 'focus.onClose', 'focus.trap', 'focus.roving', 'focus.never',
  // keyboard.*
  'keyboard.Space', 'keyboard.Enter', 'keyboard.Escape',
  'keyboard.ArrowKeys', 'keyboard.ArrowUp', 'keyboard.ArrowDown',
  'keyboard.ArrowLeft', 'keyboard.ArrowRight',
  'keyboard.Home', 'keyboard.End',
  'keyboard.PageUp', 'keyboard.PageDown',
  'keyboard.TypeAhead',
  // claims outside one element's snapshot
  'content.noAutoDismiss',
  'alternative.table',
  // conditional states — see the note above
  'states.disabled', 'states.required', 'states.readonly',
  'states.multiselectable', 'states.busy', 'states.posinset',
]);

/** Decide one requirement against one element.
 *  @param {object} el
 *  @param {string} key dotted requirement key, e.g. 'roles.element'
 *  @param {unknown} value the pattern's declared prose for that key. Reported in
 *    an OVERCLAIM message so a reader sees what was asked for; never parsed.
 *  @param {string} patternName the owning pattern's name, which is what selects
 *    the semantics for roles.element and roles.label
 *  @returns {true | false | null} null = undecidable from this element alone
 *  @throws {Error} on a key in neither DECIDABLE nor BEHAVIOURAL, and on a
 *    roles.element requirement whose pattern has no ELEMENT_ROLE entry. Both are
 *    programming errors — a typo in a pattern file, or a map left un-extended —
 *    not verdicts about a component, so neither may be returned as one. */
export function evaluate(el, key, value, patternName) {
  if (key === 'roles.element') {
    const wanted = ELEMENT_ROLE[patternName];
    if (!wanted) {
      throw new Error(
        `evaluate: pattern "${patternName}" requires roles.element but has no ELEMENT_ROLE entry. ` +
        'Add one in scripts/lib/behaviour-compliance.mjs naming the role that pattern requires.',
      );
    }
    return roleOf(el) === wanted;
  }
  if (key === 'roles.label') return hasAccessibleName(el, LABEL_ACCEPTS_TEXT.has(patternName));

  const attr = ATTRIBUTE_FOR[key];
  if (attr) return el.getAttribute(attr) !== null;

  const wanted = ROLE_NAMED_BY_KEY[key];
  if (wanted) {
    const actual = roleOf(el);
    return Array.isArray(wanted) ? wanted.includes(actual) : actual === wanted;
  }

  if (key === 'states.checked') {
    // A native checkbox or radio exposes checked-ness through the platform, with
    // no aria-checked to read. Crediting only the attribute applied the
    // implicit-semantics principle to roles and withheld it from states, which is
    // the same defect in a different place.
    if (el.getAttribute('aria-checked') !== null) return true;
    const role = roleOf(el);
    return el.tagName.toUpperCase() === 'INPUT' && (role === 'checkbox' || role === 'radio');
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

  if (BEHAVIOURAL.has(key)) return null;

  throw new Error(
    `evaluate: unrecognised requirement key "${key}". ` +
    'Every key must be in DECIDABLE or BEHAVIOURAL in scripts/lib/behaviour-compliance.mjs. ' +
    'If this came from a pattern file, check it for a typo — an unknown key used to return ' +
    'null, which a suite could silence forever by declaring it behavioural.',
  );
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
 * `behavioural` is a MAP of verdicts, not a list of keys, and that is the second
 * correction this file has needed. It used to be `string[]`: naming a key there
 * meant only "my suite asserts this somehow", and the undecidable branch did
 * `used.add(key); continue;` without ever consulting the binding's exceptions. So
 * for every behavioural key the layer's one real property — that an exception can
 * expire — simply did not hold. Measured against the real tree when this was
 * found: 48 of the 94 live exceptions sat on keys that path skipped (focus.roving,
 * keyboard.Escape, focus.onOpen/onClose/trap, the arrow keys, the six conditional
 * states). The sharp form returned `[]` in silence — a binding excepting
 * `states.disabled` ("we do not implement this") beside a suite declaring
 * `states.disabled` behavioural ("my own test asserts this") is flatly
 * contradictory, and the comparison said nothing about it.
 *
 * So a suite now declares the VERDICT its behavioural test established — `true`
 * = my test proved the requirement met, `false` = my test proved it unmet — and
 * that verdict flows into exactly the same bidirectional rule as a DOM-derived
 * one: met + excepted is a STALE EXCEPTION, unmet + unexcepted is an OVERCLAIM.
 *
 * Be clear about what this does and does not establish. It does NOT make this
 * module prove the behaviour — nothing here traps focus or presses a key; the
 * suite's own test does that, and the declaration is only the wire carrying that
 * test's result to the binding. That wire was the missing half. A declaration is
 * still a claim by the suite author, exactly as `check:behaviour`'s green run is
 * "a coverage claim, never an accessibility one".
 *
 * @param {object} o
 * @param {{name: string, requires: Record<string, unknown>}} o.pattern
 * @param {{pattern: string, exceptions?: {requirement: string, reason: string}[]}} o.binding
 * @param {Record<string, object|null>} [o.subjects] requirement key -> the element that must carry it
 * @param {object|null} [o.fallback] the element used for any requirement not named in `subjects`
 * @param {Record<string, boolean>} [o.behavioural] requirement key -> the verdict the
 *   caller's own behavioural test established, for requirements that must be asserted
 *   by acting on the tree rather than by reading it. Every undecidable requirement must
 *   appear as a key or this reports it — silence about an unverifiable claim is what
 *   this layer exists to remove.
 * @returns {string[]} one message per problem, empty when clean
 * @throws {Error} whatever evaluate() throws — an unrecognised requirement key, or a
 *   roles.element requirement on a pattern with no ELEMENT_ROLE entry. Both are
 *   programming errors rather than verdicts, so they are not returned as problems.
 *   In a render suite that means the whole test aborts instead of reporting this
 *   component's problems beside the others; that is intended, but callers should
 *   know it can happen.
 */
export function comparePattern({ pattern, binding, subjects = {}, fallback = null, behavioural = {} }) {
  const excepted = new Map((binding.exceptions ?? []).map((e) => [e.requirement, e.reason]));
  const declared = new Map(Object.entries(behavioural));
  const used = new Set();
  const problems = [];
  // Finding 3: when a subject was missing, every requirement is skipped, so every
  // declared key also goes unused. Reporting those as "the pattern no longer
  // requires it, or it is now decidable" states two causes that are both false in
  // that state, and an author who follows the instruction deletes a correct
  // declaration and gets the opposite error next run. The report stays — silence
  // would hide a real stale declaration — but it must name the real cause.
  let missedSubject = false;

  for (const [key, value] of Object.entries(pattern.requires)) {
    const el = key in subjects ? subjects[key] : fallback;
    if (!el) {
      missedSubject = true;
      problems.push(`${key}: no subject element — nothing was rendered, or the selector matched nothing.`);
      continue;
    }
    const domVerdict = evaluate(el, key, value, pattern.name);

    // Where the verdict comes from decides the wording, never the rule.
    let verdict = domVerdict;
    let source = 'the rendered DOM';
    if (domVerdict === null) {
      if (!declared.has(key)) {
        problems.push(
          `${key}: undecidable from the DOM and not declared behavioural. ` +
          'Assert it by acting on the tree and record the verdict in `behavioural`, ' +
          'or explain why it cannot be asserted at all.',
        );
        continue;
      }
      used.add(key);
      verdict = declared.get(key) === true;
      source = 'your behavioural test';
    }

    const hasException = excepted.has(key);
    if (verdict && hasException) {
      problems.push(
        `${key}: STALE EXCEPTION — met according to ${source}, but the binding still excepts it.\n` +
        `      reason on file: ${excepted.get(key)}\n` +
        '      Delete the exception, or name a subject if the exception is about a different element.',
      );
    } else if (!verdict && !hasException) {
      problems.push(
        `${key}: OVERCLAIM — the binding declares no exception, but ${source} does not meet it.\n` +
        `      pattern requires: ${JSON.stringify(value)}`,
      );
    }
  }

  for (const key of declared.keys()) {
    if (used.has(key)) continue;
    problems.push(missedSubject
      ? `${key}: declared behavioural but never reached, because a subject element above was ` +
        'missing and its requirement was skipped. Fix the missing subject first — this ' +
        'declaration may well be correct.'
      : `${key}: declared behavioural but never reached. ` +
        'Either the pattern no longer requires it, or it is now decidable from the DOM — ' +
        'remove it from `behavioural`.');
  }
  return problems;
}
