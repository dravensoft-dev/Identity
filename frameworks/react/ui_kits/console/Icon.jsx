import React from 'react';
// Phosphor Icons (webfont). Requires the @phosphor-icons/web stylesheets loaded in the host page.
// weight: 'bold' (default) | 'regular' | 'fill' | 'duotone'
const MAP = {
  grid: 'squares-four', rocket: 'rocket-launch', activity: 'pulse', settings: 'gear-six',
  bell: 'bell', search: 'magnifying-glass', plus: 'plus', more: 'dots-three-vertical',
  revert: 'arrow-counter-clockwise', check: 'check', arrow: 'arrow-right',
};
const CLS = { bold: 'ph-bold', regular: 'ph', fill: 'ph-fill', duotone: 'ph-duotone' };
export function Icon({ name, size = 'var(--icon-lg)', weight = 'bold', style }) {
  const ph = MAP[name] || name;
  return <i className={(CLS[weight] || CLS.bold) + ' ph-' + ph} style={{ fontSize: size, lineHeight: 'var(--dz-lh)', display: 'inline-flex', ...style }} />;
}
