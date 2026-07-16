import * as React from 'react';
/** Step-by-step guided onboarding (H10). Controlled coachmark with progress and an exit ("Skip"). */
export interface OnboardingStep { eyebrow?: string; title?: string; body?: React.ReactNode; }
export interface OnboardingProps {
  open: boolean;
  steps: OnboardingStep[];
  index?: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onDone?: () => void;
  /** Optional anchor (DOMRect of the highlighted element). Without it, floats bottom-right. */
  anchorRect?: DOMRect | { left: number; bottom: number };
}
export function Onboarding(props: OnboardingProps): JSX.Element | null;
