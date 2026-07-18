/* Turns a DTCG token tree into flat preview descriptors for the Overview page.
 *
 * Pure: no I/O, no DOM, no Style Dictionary. It runs in the browser (imported
 * by overview.js) and under bun test alike.
 *
 * The group-to-preview mapping lives HERE and not in tokens/src/, because the
 * DTCG source is documented as platform-neutral and must not carry HTML
 * presentation concerns. See tokens/src/TYPE-MAP.md and README's layer contract.
 */

/* $type alone cannot choose a drawing: --fs-display and --sp-16 are both
 * `dimension` valued 64px, but one must render as 64px text and the other as a
 * 64px bar. The group decides; the type is only the fallback. */
const BY_GROUP = {
  color: 'swatch',
  font: 'family',
  fw: 'weight',
  fs: 'size',
  lh: 'leading',
  ls: 'tracking',
  sp: 'bar',
  gutter: 'bar',
  'container-max': 'bar',
  bp: 'breakpoint',
  dz: 'control',
  r: 'radius',
  bw: 'rule',
  'bw-strong': 'rule',
  shadow: 'elevation',
  scrim: 'swatch',
  'scrim-blur': 'bar',
  focus: 'rule',
  dur: 'duration',
  ease: 'easing',
};

/* A group nobody has styled yet still has to appear, so that adding a token to
 * tokens/src/ shows up here with no edit to this file. */
const BY_TYPE = {
  color: 'swatch',
  dimension: 'bar',
  duration: 'duration',
  cubicBezier: 'easing',
  fontFamily: 'family',
  fontWeight: 'weight',
  shadow: 'elevation',
  number: 'value',
};

/** @param {string} group @param {string} [type] @returns {string} preview shape */
export function previewFor(group, type) {
  return BY_GROUP[group] ?? BY_TYPE[type] ?? 'value';
}

/** Walks a DTCG tree, returning one descriptor per token in source order.
 *  `name` is the CSS custom-property name without the leading `--`.
 *  @param {object} tree
 *  @returns {Array<{name: string, group: string, path: string[], $type: string|undefined, $description: string|undefined}>} */
export function flattenTokens(tree) {
  const out = [];
  const walk = (node, path, inheritedType) => {
    const type = node.$type ?? inheritedType;
    if (node.$value !== undefined) {
      out.push({
        name: path.join('-'),
        group: path[0],
        path,
        $type: type,
        $description: node.$description,
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || child === null || typeof child !== 'object') continue;
      walk(child, [...path, key], type);
    }
  };
  walk(tree, [], undefined);
  return out;
}
