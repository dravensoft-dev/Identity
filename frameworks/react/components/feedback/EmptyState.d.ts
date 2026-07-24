import * as React from 'react';
/** Guided empty state. `action` is usually a Button that creates the first item. */
export interface EmptyStateProps {
  /** @startingPoint A Phosphor class name (e.g. "ph-duotone ph-folder-open") for
   * the glyph; rendered muted. Arena draws the `<i>` — absent renders none. */
  icon?: string;
  /** The headline — what is empty. */
  title: string;
  message?: string;
  action?: React.ReactNode;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
