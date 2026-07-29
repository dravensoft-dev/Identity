import * as React from 'react';
import type { TagTone } from '../../api.generated';
/** A pill for filters, technologies and statuses. `tone` sets the emphasis
 *  colour; an `onRemove` listener adds the dismiss ×. */
export interface TagProps {
  children?: React.ReactNode;
  tone?: TagTone;
  removable?: boolean;
  onRemove?: () => void;
}
export function Tag(props: TagProps): JSX.Element;
