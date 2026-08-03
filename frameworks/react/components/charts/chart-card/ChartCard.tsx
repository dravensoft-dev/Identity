import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './ChartCard.manifest.generated.ts';

export interface ChartCardProps {

  /** The card heading. Absent renders no head unless `actions` is present. */
  title?: string;

  /** Controls in the head row, right-aligned beside the title. */
  actions?: React.ReactNode;
  /** The chart (or any body) the card frames. */
  children?: React.ReactNode;
}


const chartCardStyles = tv(manifest);

export function ChartCard({ title, actions, children }: ChartCardProps) {
  const styles = chartCardStyles();
  return (
    <div className={styles.root()}>
      {(title || actions) && (
        <div className={styles.head()}>
          {title && <span className={styles.title()}>{title}</span>}
          {actions && <div className={styles.actions()}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
