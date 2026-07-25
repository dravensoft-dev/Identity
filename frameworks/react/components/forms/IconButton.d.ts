import type { ButtonType, ControlSize, IconButtonVariant } from '../../api.generated';

/** Icon-only button. Requires `label` for accessibility. */
export interface IconButtonProps {
  /** Phosphor class name, e.g. `'ph-bold ph-plus'`. Arena draws the `<i>`. */
  icon: string;
  /** Accessible name in ALL states, not just hover. */
  label: string;
  size?: ControlSize;
  variant?: IconButtonVariant;
  /** Shows the `label` as text next to the icon (H6). Don't rely on the title alone. */
  showLabel?: boolean;
  disabled?: boolean;
  /** Defaults to `'button'` so an icon button inside a form does not submit it. */
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
export function IconButton(props: IconButtonProps): JSX.Element;
