import React, { useId } from 'react';
import { injectInto, indentFor, COLUMN } from '../side-nav/SideNavInject.jsx';

export function SideNavSection({
  label, children,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {

  if (!label) throw new Error('SideNavSection: `label` is required');

  if (React.Children.toArray(children).length === 0) {
    throw new Error('SideNavSection: a section with no children is not a legal shape');
  }
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} style={COLUMN}>
      <div id={labelId} style={{
        paddingInlineStart: indentFor(indentStep, depth),
        paddingBlock: 'calc(var(--sp-1) * 1.5)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)',
        letterSpacing: 'var(--ls-badge)', textTransform: 'uppercase',
        color: 'var(--mute)',
      }}>{label}</div>
      {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
    </div>
  );
}
