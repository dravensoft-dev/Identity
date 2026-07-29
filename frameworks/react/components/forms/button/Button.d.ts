import * as React from 'react';
import type { ButtonType, ButtonVariant, ControlSize } from '../../../Api.generated';

/**
 * Arena action button. Primary crimson for the main action (one per view);
 * secondary for neutral actions, ghost for tertiary ones, danger for destructive actions.
 * @startingPoint section="Forms" subtitle="Button with variants and states" viewport="700x160"
 */
export interface ButtonProps {
  /** The button's label. Sits between the two icons when both are given. */
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ControlSize;
  /** Phosphor class name drawn before the label, e.g. `'ph-bold ph-plus'`. */
  icon?: string;
  /** Phosphor class name drawn after the label. */
  iconRight?: string;
  /** Replaces the leading icon with a spinner and blocks activation. */
  loading?: boolean;
  /** Stretches to the container's width. */
  full?: boolean;
  disabled?: boolean;
  /** Defaults to `'button'` so a button inside a form does not submit it. */
  type?: ButtonType;
  /** Submitted with the form, when the button submits one. */
  name?: string;
  /** The value submitted under `name`. */
  value?: string;
  /** Focused on mount. */
  autoFocus?: boolean;
  /** The `id` of the form this button belongs to, when it is not a descendant of it. */
  form?: string;
  /** Whether the control is reached from the page's Tab sequence. Set `false`
   *  inside a composite that manages its own focus — a grid with a roving tab
   *  stop, a menu — where reaching it by Tab would be a second way in. The
   *  control stays programmatically focusable. */
  tabStop?: boolean;
  /** The button was activated, by pointer or by keyboard. */
  onClick?: () => void;
}
export function Button(props: ButtonProps): JSX.Element;
