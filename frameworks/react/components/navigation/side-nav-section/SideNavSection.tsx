import React, { useId } from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.tsx';
import { indentFor, injectInto } from '../side-nav/SideNavInject.tsx';
import { tv } from '../../../Tv.generated.ts';
import manifest from '../side-nav/SideNav.manifest.generated.ts';

export interface SideNavSectionProps {

  /** Names the group, both on screen and to assistive technology. Required, and guarded at runtime: a blank label leaves the group with no accessible name, which is the defect the guard exists to prevent arriving through a value that is present, so the guard trims before it decides. */
  label: string;

  /** The items in the group -- SideNavItems, further SideNavSections, SideNavCollapsibles. Each sits one nesting level deeper than the section itself. Required, and guarded at runtime: a section with no children is not a legal shape, and the guard counts the way the render path counts, so a child that is a false conditional counts as absent rather than as one. The AppLogo.mark shape -- a slot that is both declared required and enforced -- and not the Tooltip.content one, which is declared required and deliberately left unguarded. */
  children: React.ReactNode;
}


const sideNavStyles = tv(manifest);

export function SideNavSection({
  label, children,
  depth = 0, activeId, indentStep = 3, onActivate,
}: SideNavSectionProps & Partial<SideNavInjected>) {

  if (!label?.trim()) throw new Error('SideNavSection: `label` is required');

  if (React.Children.toArray(children).length === 0) {
    throw new Error('SideNavSection: a section with no children is not a legal shape');
  }
  const labelId = useId();
  const styles = sideNavStyles();
  return (
    <div role="group" aria-labelledby={labelId} className={styles.section()}>
      <div id={labelId} className={styles.sectionLabel()}
        style={{ paddingInlineStart: indentFor(indentStep, depth) }}>{label}</div>
      {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
    </div>
  );
}
