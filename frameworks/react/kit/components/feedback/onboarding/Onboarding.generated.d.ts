import React from 'react';
import type { OnboardingStep, OnboardingAnchor } from '../../../Api.generated';
export type { OnboardingStep };
export interface OnboardingProps {
    open: boolean;
    steps: OnboardingStep[];
    index?: number;
    anchor?: OnboardingAnchor;
    onNext?: () => void;
    onBack?: () => void;
    onSkip?: () => void;
    onDone?: () => void;
}
export declare function Onboarding({ open, steps, index, onNext, onBack, onSkip, onDone, anchor }: OnboardingProps): React.JSX.Element | null;
