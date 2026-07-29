import type { OnboardingStep, OnboardingAnchor } from '../../api.generated';

export type { OnboardingStep };

/** Step-by-step guided onboarding (H10). Controlled coachmark with progress and an exit ("Skip"). */
export interface OnboardingProps {
  /** Whether the tour is shown. Closed renders nothing, scrim included. */
  open: boolean;
  /** The tour, in order. An empty tour renders nothing. */
  steps: OnboardingStep[];
  /** Which step is current. The host owns it and answers onNext/onBack. */
  index?: number;
  /** Where to attach the coachmark. Absent floats it bottom-right.
   *  A DOMRect is structurally assignable, so getBoundingClientRect() passes directly. */
  anchor?: OnboardingAnchor;
  /** Next was activated on a step that is not the last. */
  onNext?: () => void;
  /** Back was activated on a step that is not the first. */
  onBack?: () => void;
  /** Skip was activated, or the scrim was clicked. */
  onSkip?: () => void;
  /** The final step's confirming control was activated. */
  onDone?: () => void;
}
export function Onboarding(props: OnboardingProps): JSX.Element | null;
