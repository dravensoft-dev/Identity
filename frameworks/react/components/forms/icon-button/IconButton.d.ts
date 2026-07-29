import type { ButtonType, ControlSize, IconButtonVariant } from '../../../Api.generated';

export interface IconButtonProps {

  icon: string;

  label: string;
  size?: ControlSize;
  variant?: IconButtonVariant;

  showLabel?: boolean;
  disabled?: boolean;

  type?: ButtonType;

  name?: string;

  value?: string;

  autoFocus?: boolean;

  form?: string;

  tabStop?: boolean;

  onClick?: () => void;
}
export function IconButton(props: IconButtonProps): JSX.Element;
