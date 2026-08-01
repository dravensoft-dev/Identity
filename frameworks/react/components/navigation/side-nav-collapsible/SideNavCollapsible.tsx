import React, { useEffect, useState } from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.tsx';
import { injectInto, COLUMN, rowStyle, rowGlyph } from '../side-nav/SideNavInject.tsx';
import { SideNavItem } from '../side-nav-item/SideNavItem.tsx';

export interface SideNavCollapsibleProps {

  /** Identifies the group. The disclosure pattern needs two DOM ids that resolve -- the trigger's aria-controls must name the region, and the region's aria-labelledby must name the trigger -- and Arena derives both from this member, as `${id}-trigger` and `${id}-region`. Neither wiring is conditional: every collapsible has a trigger and a region, so there is no shape in which the id goes unused, and that is why it is required rather than optional. A group is a thing a consumer names anyway. Falsy-guarded as well as required: a blank id yields the pair `-trigger`/`-region`, which every other blank-id collapsible on the page would share, and duplicate ids make aria-controls resolve to the wrong element rather than to none. A consumer can address either element from outside as a consequence -- an aria-describedby, a deep link, a test hook -- but that is a benefit of the derivation, not the reason for it. */
  id: string;

  /** What the trigger reads, and the accessible name of both the trigger and the region it controls. Required and falsy-guarded. */
  label: string;

  /** A Phosphor class name drawn before the label. The caret that reports expanded-ness is Arena's own and is not this member. */
  icon?: string;

  /** Whether the group starts open. It is a seed, not a control: after the first render the state is the component's, and the group also opens itself when it comes to hold the active destination. */
  defaultExpanded?: boolean;

  /** What the group holds -- items, sections, further collapsibles. Each sits one nesting level deeper. */
  children?: React.ReactNode;

  /** The trigger was pressed, carrying the state it moved to. It fires on a press ONLY: the automatic expansion that follows the active destination is Arena's decision rather than the user's, and reporting it here would be a lie a consumer persists. */
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
