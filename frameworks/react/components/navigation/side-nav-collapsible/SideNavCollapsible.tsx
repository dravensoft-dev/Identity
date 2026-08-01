import React, { useEffect, useState } from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.tsx';
import { injectInto, COLUMN, rowStyle, rowGlyph } from '../side-nav/SideNavInject.tsx';
import { SideNavItem } from '../side-nav-item/SideNavItem.tsx';

export interface SideNavCollapsibleProps {

  id: string;

  label: string;

  icon?: string;

  defaultExpanded?: boolean;

  children?: React.ReactNode;

  onToggle?: (expanded: boolean) => void;
}


export function subtreeHasItem(children: React.ReactNode, id: string | undefined): boolean {
  if (!id) return false;
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue;
    const props = child.props as { id?: string; children?: React.ReactNode };
    if (child.type === SideNavItem && props.id === id) return true;
    if (subtreeHasItem(props.children, id)) return true;
  }
  return false;
}

export function SideNavCollapsible({
  id, label, icon, defaultExpanded = false, children, onToggle,
  depth = 0, activeId, indentStep = 3, onActivate,
}: SideNavCollapsibleProps & Partial<SideNavInjected>) {

  if (!id) throw new Error('SideNavCollapsible: `id` is required');
  if (!label) throw new Error('SideNavCollapsible: `label` is required');

  const holdsActive = subtreeHasItem(children, activeId);

  const [expanded, setExpanded] = useState(defaultExpanded || holdsActive);
  useEffect(() => { if (holdsActive) setExpanded(true); }, [holdsActive]);

  const regionId = `${id}-region`;
  const triggerId = `${id}-trigger`;

  const press = () => {
    const next = !expanded;
    setExpanded(next);
    if (onToggle) onToggle(next);
  };

  const glyph = rowGlyph(icon);

  return (
    <div style={COLUMN}>
      {

}
      <button id={triggerId} type="button" aria-expanded={expanded} aria-controls={regionId}
        onClick={press}
        style={rowStyle({
          indentStep, depth,
          background: 'transparent', color: 'var(--mute)', fontWeight: 'var(--fw-medium)',
        })}>
        {glyph}
        <span style={{ flex: 1 }}>{label}</span>
        <i className={expanded ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}
          aria-hidden="true" style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }} />
      </button>
      {
}
      <div id={regionId} role="group" aria-labelledby={triggerId} hidden={!expanded}
        style={{ ...COLUMN, display: expanded ? 'flex' : 'none' }}>
        {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
      </div>
    </div>
  );
}
