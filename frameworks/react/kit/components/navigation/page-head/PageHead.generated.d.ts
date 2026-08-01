import React from 'react';
import type { PageHeadAlign } from '../../../Api.generated';
export interface PageHeadProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    align?: PageHeadAlign;
}
export declare function PageHead({ title, subtitle, actions, align }: PageHeadProps): React.JSX.Element;
