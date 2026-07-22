/* Renders a script-readable DTCG token to the bare JavaScript number the
 * generated per-layer modules export.
 *
 * Sibling of serialize-token.mjs and under the same contract: Style Dictionary
 * never transforms these values, Arena renders them. Where serialize-token.mjs
 * produces the CSS string ("280px"), this produces the number JS does
 * arithmetic on (280). The parity gate (scripts/check-script-tokens.mjs) is
 * what holds the two in step.
 *
 * Only dimension, duration and number are script-readable, because they are the
 * only DTCG types whose value IS a number. A color or a shadow has no bare
 * numeric form, and flagging one is a mistake this refuses rather than guesses
 * at. */

/** Types whose $value reduces to a single number. */
const NUMERIC = new Set(['dimension', 'duration', 'number']);

/** @param {{ $type?: string, $value: unknown }} token @returns {number} */
export function serializeScript(token) {
  if (!NUMERIC.has(token.$type)) {
    throw new Error(`serializeScript: $type "${token.$type}" is not script-readable`);
  }
  if (token.$type === 'number') return token.$value;
  return token.$value.value;
}

/** "chart-pad-left" -> "chartPadLeft". The build's name/kebab transform has
 *  already run, so this only has to camelCase what it produced. */
export function scriptName(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}
