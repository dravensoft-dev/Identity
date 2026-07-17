import * as React from 'react';
/** Tab navigation. Controlled (value+onChange) or uncontrolled (defaultValue). Active = crimson underline. */
export interface TabItem { value: string; label: string; }
export interface TabsProps {
  tabs: (string | TabItem)[];
  value?: string; defaultValue?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export function Tabs(props: TabsProps): JSX.Element;
