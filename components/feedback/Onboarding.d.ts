import * as React from 'react';
/** Onboarding guiado por pasos (H10). Coachmark controlado con progreso y salida ("Saltar"). */
export interface OnboardingStep { eyebrow?: string; title?: string; body?: React.ReactNode; }
export interface OnboardingProps {
  open: boolean;
  steps: OnboardingStep[];
  index?: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onDone?: () => void;
  /** Ancla opcional (DOMRect del elemento destacado). Sin él, flota abajo-derecha. */
  anchorRect?: DOMRect | { left: number; bottom: number };
}
export function Onboarding(props: OnboardingProps): JSX.Element | null;
