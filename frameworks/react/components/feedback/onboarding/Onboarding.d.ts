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
export function Onboarding(props: OnboardingProps): JSX.Element | null;
