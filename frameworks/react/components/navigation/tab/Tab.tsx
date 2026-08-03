import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from '../tabs/Tabs.classes.generated.ts';

export interface TabInjected {
  selected: boolean;
  tabStop: boolean;
  tabId: string;
  panelId: string;
  onSelect: (value: string) => void;
}

export interface TabProps {

  /** What this tab selects, and what the parent's `change` carries. */
  value: string;

  /** What the tab reads. Arena draws the button; the consumer names it. */
  label: string;

  /** What the panel shows while this tab is selected. Tabs places it; Tab never renders it, because a tabpanel may not sit inside a tablist. */
  children?: React.ReactNode;
}


const tabsStyles = arenaStyles(manifest);

export function Tab({
  value, label,
  selected = false, tabStop = false, tabId, panelId, onSelect,
}: TabProps & Partial<TabInjected>) {

  if (!value) throw new Error('Tab: `value` is required');
  if (!label) throw new Error('Tab: `label` is required');
  return (
    <button type="button" role="tab" id={tabId}
      aria-selected={selected} aria-controls={panelId}

      tabIndex={tabStop ? 0 : -1}
      onClick={() => onSelect && onSelect(value)}
      className={tabsStyles({ selected }).tab()}>
      {label}
    </button>
  );
}
