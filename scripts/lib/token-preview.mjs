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

export function previewFor(group, type) {
  return BY_GROUP[group] ?? BY_TYPE[type] ?? 'value';
}

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
