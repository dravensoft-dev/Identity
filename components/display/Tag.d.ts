import * as React from 'react';
/** Chip for filters, technologies, tags. `onRemove` shows the dismiss ×. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
}
export function Tag(props: TagProps): JSX.Element;
