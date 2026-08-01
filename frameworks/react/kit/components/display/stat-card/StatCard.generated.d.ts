import React from 'react';
import type { StatDelta, Tone } from '../../../Api.generated';
export type { StatDelta };
export interface StatCardProps {
    label: string;
    value: string;
    tone?: Tone;
    delta?: StatDelta;
    sub?: string;
    icon?: string;
}
export declare function StatCard({ label, value, tone, delta, sub, icon }: StatCardProps): React.JSX.Element;
