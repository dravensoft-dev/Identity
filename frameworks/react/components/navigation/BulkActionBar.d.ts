import * as React from 'react';
/** Bulk actions bar (H7). Shown when rows are selected; hidden if count===0. */
export interface BulkAction { label: string; icon?: React.ReactNode; onClick: () => void; destructive?: boolean; }
export interface BulkActionBarProps {
  count: number;
  noun?: string;
  actions: BulkAction[];
  onClear?: () => void;
  style?: React.CSSProperties;
}
export function BulkActionBar(props: BulkActionBarProps): JSX.Element | null;
