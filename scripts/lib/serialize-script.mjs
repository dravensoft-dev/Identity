const NUMERIC = new Set(['dimension', 'duration', 'number']);

export function serializeScript(token) {
  if (!NUMERIC.has(token.$type)) {
    throw new Error(`serializeScript: $type "${token.$type}" is not script-readable`);
  }
  if (token.$type === 'number') return token.$value;
  return token.$value.value;
}

export function scriptName(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}
