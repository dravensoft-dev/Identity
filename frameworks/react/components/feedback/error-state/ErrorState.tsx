import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './ErrorState.manifest.generated.ts';
import { Button } from '../../forms/button/Button.tsx';

export interface ErrorStateProps {
  /** A Phosphor class name for the danger glyph Arena draws. */
  icon?: string;
  /** The headline: what failed. */
  title?: string;
  /** A sentence of detail under the title. */
  message?: string;
  /** A diagnostic/support code, shown monospaced. */
  code?: string;
  /** The label of the retry button Arena draws. Absent renders no retry. */
  retryLabel?: string;
  /** The retry button was activated. */
  onRetry?: () => void;
  /** An extra control beside the retry (e.g. a link to logs). */
  secondaryAction?: React.ReactNode;
}


const errorStyles = tv(manifest);

export function ErrorState({ icon, title = 'Something went wrong', message, code, retryLabel, onRetry, secondaryAction }: ErrorStateProps) {
  const styles = errorStyles();
  return (
    <div role="alert" className={styles.root()}>
      {icon && <div className={styles.icon()}><i className={icon} aria-hidden="true" /></div>}
      <div className={styles.title()}>{title}</div>
      {message && <div className={styles.message()}>{message}</div>}
      {code && <code className={styles.code()}>{code}</code>}
      <div className={styles.actions()}>
        {retryLabel && <Button variant="primary" onClick={onRetry}>{retryLabel}</Button>}
        {secondaryAction}
      </div>
    </div>
  );
}
