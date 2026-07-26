import * as React from 'react';

/** One tab in a `Tabs` strip, and the panel it shows. Write one per view.
 *
 *  Everything about WHERE the tab sits -- whether it is selected, the ids wiring
 *  it to its panel, and the handler that reports the choice -- is injected by
 *  `Tabs` and is deliberately absent from this interface, exactly as
 *  `RadioProps` omits what `RadioGroup` injects. */
export interface TabProps {
  /** What this tab selects, and what `Tabs`' `onChange` carries. Required, and
   *  guarded at runtime against a blank value as well as an absent one. */
  value: string;
  /** What the tab reads. Required, and guarded the same way -- it is the tab's
   *  whole accessible name. */
  label: string;
  /** What the panel shows while this tab is selected. `Tabs` places it in the
   *  tabpanel it renders for this tab -- one per tab, all but the selected one
   *  hidden -- and this component never draws it. It MOUNTS whether or not the
   *  tab is selected, so keep a cost you only want to pay on selection out of it.
   *  @startingPoint the view this tab switches to. */
  children?: React.ReactNode;
}

export function Tab(props: TabProps): JSX.Element;
