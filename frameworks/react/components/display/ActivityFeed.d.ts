import * as React from 'react';
export interface ActivityItem {
  id?: React.Key;
  /** Who. Rendered in --bone. */
  actor?: React.ReactNode;
  /** What they did. Rendered in --bone-dim. */
  action?: React.ReactNode;
  /** What they did it to. Rendered in mono --gold — it is an identifier. */
  target?: React.ReactNode;
  /** When. Mono --mute, pushed right. */
  time?: React.ReactNode;
  /** Badge's vocabulary, driving the leading dot. Default 'accent'. */
  tone?: 'neutral' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'info';
}
/** Event feed — someone did something to something, then.
 * @startingPoint section="Display" subtitle="Event feed" viewport="560x440" */
export interface ActivityFeedProps extends React.HTMLAttributes<HTMLUListElement> {
  items: ActivityItem[];
  /** Replaces a row's contents entirely — the same escape hatch Table gives
   *  through columns[].render. Use it for the event the grammar does not fit,
   *  rather than abandoning the component for hand-rolled markup. */
  renderItem?: (item: ActivityItem) => React.ReactNode;
  style?: React.CSSProperties;
}
export function ActivityFeed(props: ActivityFeedProps): JSX.Element;
