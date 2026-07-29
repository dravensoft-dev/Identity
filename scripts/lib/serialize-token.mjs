const EXT = 'com.dravensoft.arena';

const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'math', 'emoji', 'fangsong',
]);

const trim = (n) => String(n).replace(/^(-?)0\./, '$1.');

const dim = (d) => (d.value === 0 ? '0' : `${d.value}${d.unit}`);

const color = (c) => {
  if (c.hex) return c.hex;
  const [r, g, b] = c.components.map((v) => Math.round(v * 255));
  const a = c.alpha ?? 1;
  return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${trim(a)})`;
};

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
