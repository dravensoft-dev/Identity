import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './Toast.manifest.generated.ts';

import type { ToastTone } from '../../../Api.generated';
import { dismissDefault, dismissActionable } from '../../../Tokens.generated.js';

export interface ToastProps {

  /** The bold lead line. */
  title?: string;

  /** The body. */
  message?: string;

  /** The side bar's colour, and whether the toast announces assertively. */
  tone?: ToastTone;

  /** The label of the single inline action: Undo, Retry, View logs. Absent renders no action. */
  actionLabel?: string;

  /** The inline action was activated. */
  onAction?: () => void;

  /** Disables the host's auto-dismiss and shows the Pinned marker. **Implied by `tone: "danger"`, which ignores `false`**: a critical message that vanishes on a timer is one a user can miss entirely, and this was documented as mandatory in an error state while nothing enforced it. Set it explicitly for any other tone that must not disappear on its own. */
  persist?: boolean;

  /** Whether the × is shown. Every layer gates the × on this member and never on whether anything listens for `close`, per R6. */
  dismissible?: boolean;

  /** The × was activated. */
  onClose?: () => void;
}

export const TOAST_DISMISS = { default: dismissDefault, actionable: dismissActionable } as const;

const toastStyles = tv(manifest);
const TONES = Object.keys(manifest.variants.tone);
type Tone = keyof typeof manifest.variants.tone;
const toneOf = (tone: string | undefined): Tone =>
  (tone && TONES.includes(tone) ? tone as Tone : 'neutral');

export function Toast({ title, message, tone = 'neutral', actionLabel, onAction, dismissible = false, onClose, persist = false }: ToastProps) {
  const pinned = persist || tone === 'danger';
  const styles = toastStyles({ tone: toneOf(tone) });
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} aria-live={tone === 'danger' ? 'assertive' : 'polite'}
      data-persist={pinned ? '' : undefined} className={styles.root()}>
      <div className={styles.body()}>
        {title && (
          <div className={styles.title()}>
            {title}
            {pinned && <span title="Does not auto-dismiss" className={styles.pinned()}>Pinned</span>}
          </div>
        )}
        {message && <div className={styles.message()}>{message}</div>}
        {actionLabel && (
          <button onClick={onAction} className={styles.action()}>{actionLabel}</button>
        )}
      </div>
      {dismissible && (
        <button onClick={onClose} aria-label="Close" className={styles.close()}>
          <i className="ph-bold ph-x" />
        </button>
      )}
    </div>
  );
}
