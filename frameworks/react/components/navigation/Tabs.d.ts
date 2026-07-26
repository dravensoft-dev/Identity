import * as React from 'react';

/** A row of tabs and the one panel they switch between. Write one `<Tab>` per
 *  view, as siblings or in an array -- never wrapped in a fragment or in a
 *  component of your own, which `React.Children.toArray` cannot see through. */
export interface TabsProps {
  /** The tabs. `Tabs` injects each one's selected state, the ids wiring it to the
   *  panel, and the handler that reports the choice.
   *  @startingPoint one `<Tab value label>` per view, its children being what that
   *  view shows. */
  children?: React.ReactNode;
  /** The selected tab's value. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;
  /** The initially selected value when uncontrolled. Defaults to the first tab. */
  defaultValue?: string;
  /** A different tab was chosen; carries its value. */
  onChange?: (value: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
