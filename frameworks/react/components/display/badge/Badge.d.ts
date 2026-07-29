import * as React from 'react';
import type { Tone } from '../../../Api.generated';

export interface BadgeProps {

  children?: React.ReactNode;
  tone?: Tone;

  dot?: boolean;
}
export function Badge(props: BadgeProps): JSX.Element;
