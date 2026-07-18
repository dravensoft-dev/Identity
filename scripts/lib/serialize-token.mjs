/* Renders a strict DTCG 2025.10 value back to the CSS string Arena ships.
 *
 * Style Dictionary v4 is never allowed to transform these values — its built-in
 * CSS transforms predate 2025.10 and do not understand structured colors or
 * {value,unit} dimensions. Everything below is Arena's own rendering, and the
 * golden gate (scripts/check-tokens-generated.mjs) is what holds it honest. */

const EXT = 'com.dravensoft.arena';

/** CSS generic font families, which are keywords and must not be quoted. */
const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'math', 'emoji', 'fangsong',
]);

/** Strips the leading zero of a sub-unit number: 0.6 -> ".6". Used only where
 *  Arena's shipped CSS does so — cubic-bezier components and rgba alpha. */
const trim = (n) => String(n).replace(/^(-?)0\./, '$1.');

/** A dimension renders bare at zero, matching `--sp-0:0`. */
const dim = (d) => (d.value === 0 ? '0' : `${d.value}${d.unit}`);

const color = (c) => {
  if (c.hex) return c.hex;
  const [r, g, b] = c.components.map((v) => Math.round(v * 255));
  const a = c.alpha ?? 1;
  return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${trim(a)})`;
};

/** @param {{ $type?: string, $value: unknown, $extensions?: Record<string, any> }} token */
export function serialize(token) {
  const v = token.$value;
  switch (token.$type) {
    case 'dimension':
      return dim(v);
    case 'duration':
      return `${v.value}${v.unit}`;
    case 'number': {
      const unit = token.$extensions?.[EXT]?.cssUnit;
      if (!unit) return String(v);
      return v === 0 ? '0' : `${v}${unit}`;
    }
    case 'fontWeight':
      return String(v);
    case 'cubicBezier':
      return `cubic-bezier(${v.map(trim).join(',')})`;
    case 'color':
      return color(v);
    case 'fontFamily':
      return (Array.isArray(v) ? v : [v])
        .map((f) => (GENERIC_FAMILIES.has(f) ? f : `'${f}'`))
        .join(',');
    case 'shadow':
      return `${dim(v.offsetX)} ${dim(v.offsetY)} ${dim(v.blur)} ${dim(v.spread)} ${color(v.color)}`;
    default:
      throw new Error(`serialize: unsupported $type: ${token.$type}`);
  }
}
