import * as React from 'react';
/** Icon-only button. Requires `label` for accessibility. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'solid';
  label: string;
  /** Shows the `label` as text next to the icon (H6). Don't rely on the tooltip alone. */
  showLabel?: boolean;
}
export function IconButton(props: IconButtonProps): JSX.Element;
