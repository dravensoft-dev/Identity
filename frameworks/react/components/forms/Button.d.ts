import * as React from 'react';
/**
 * Arena action button. Primary crimson for the main action (one per view);
 * secondary for neutral actions, ghost for tertiary ones, danger for destructive actions.
 * @startingPoint section="Forms" subtitle="Button with variants and states" viewport="700x160"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  full?: boolean;
}
export function Button(props: ButtonProps): JSX.Element;
