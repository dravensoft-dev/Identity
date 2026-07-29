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
export function StatCard(props: StatCardProps): JSX.Element;
