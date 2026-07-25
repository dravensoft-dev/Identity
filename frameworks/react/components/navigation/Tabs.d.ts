import type { TabItem } from '../../api.generated';
/** Tab navigation between views. The active tab carries the crimson underline. */
export type { TabItem };
export interface TabsProps {
  /** The tabs, in order. */
  tabs: TabItem[];
  /** The selected tab's value. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;
  /** The initially selected value when uncontrolled. Defaults to the first tab. */
  defaultValue?: string;
  /** A different tab was chosen; carries its value. */
  onChange?: (value: string) => void;
}
export function Tabs(props: TabsProps): JSX.Element;
