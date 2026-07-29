import * as React from 'react';
import type { PageHeadAlign } from '../../../Api.generated';

export interface PageHeadProps {

  title: string;

  subtitle?: string;

  actions?: React.ReactNode;

  align?: PageHeadAlign;
}
export function PageHead(props: PageHeadProps): JSX.Element;
