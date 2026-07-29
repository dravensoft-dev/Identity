import * as React from 'react';
import type { TagTone } from '../../../Api.generated';

export interface TagProps {
  children?: React.ReactNode;
  tone?: TagTone;
  removable?: boolean;
  disabled?: boolean;
  onRemove?: () => void;
}
export function Tag(props: TagProps): JSX.Element;
