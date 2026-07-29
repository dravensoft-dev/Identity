import * as React from 'react';
import type { ButtonType, ButtonVariant, ControlSize } from '../../../Api.generated';

export interface ButtonProps {

  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ControlSize;

  icon?: string;

  iconRight?: string;

  loading?: boolean;

  full?: boolean;
  disabled?: boolean;

  type?: ButtonType;

  name?: string;

  value?: string;

  autoFocus?: boolean;

  form?: string;

  tabStop?: boolean;

  onClick?: () => void;
}
export function Button(props: ButtonProps): JSX.Element;
