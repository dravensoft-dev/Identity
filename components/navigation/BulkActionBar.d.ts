import * as React from 'react';
/** Barra de acciones masivas (H7). Se muestra al seleccionar filas; oculta si count===0. */
export interface BulkAction { label: string; icon?: React.ReactNode; onClick: () => void; destructive?: boolean; }
export interface BulkActionBarProps {
  count: number;
  noun?: string;
  actions: BulkAction[];
  onClear?: () => void;
  style?: React.CSSProperties;
}
export function BulkActionBar(props: BulkActionBarProps): JSX.Element | null;
