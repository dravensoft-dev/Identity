import * as React from 'react';
/** Navegación por pestañas. Controlado (value+onChange) o no (defaultValue). Activa = subrayado carmesí. */
export interface TabItem { value: string; label: string; }
export interface TabsProps {
  tabs: (string | TabItem)[];
  value?: string; defaultValue?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export function Tabs(props: TabsProps): JSX.Element;
