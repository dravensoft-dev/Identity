import type { BulkAction } from '../../api.generated';

export type { BulkAction };

/** Bulk actions bar (H7). Shown when rows are selected; renders nothing at count 0. */
export interface BulkActionBarProps {
  /** How many rows are selected. Zero renders no bar at all. */
  count: number;
  /** What is being counted, plural — "items", "projects". */
  noun?: string;
  /** The actions offered for the current selection. */
  actions: BulkAction[];
  /** An action was activated, carrying which one. */
  onRun?: (action: BulkAction) => void;
  /** Whether the Clear control is drawn. Defaults to true — a selection the
   *  user cannot see the edges of is one they act on by accident. Both
   *  layers gate on this member; Angular cannot detect a `clear` listener. */
  clearable?: boolean;
  /** The Clear control was activated. Fires only while `clearable`. */
  onClear?: () => void;
}
export function BulkActionBar(props: BulkActionBarProps): JSX.Element | null;
