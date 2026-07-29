import type { BulkAction } from '../../../Api.generated';

export type { BulkAction };

export interface BulkActionBarProps {

  count: number;

  noun?: string;

  actions: BulkAction[];

  onRun?: (action: BulkAction) => void;

  clearable?: boolean;

  onClear?: () => void;
}
export function BulkActionBar(props: BulkActionBarProps): JSX.Element | null;
