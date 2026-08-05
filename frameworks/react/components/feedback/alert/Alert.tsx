import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Alert.classes.generated.ts';

import type { ArenaAlertTone } from '../../../Api.generated';

export interface AlertProps {
  /** The severity: colour, default icon, and (for danger) the alert role. */
  tone?: ArenaAlertTone;
  /** An optional bold lead line above the message. */
  title?: string;
  /** The message body. */
  children?: React.ReactNode;
  /** A Phosphor class name overriding the tone's default glyph. Arena draws it. */
  icon?: string;
  /** The label of a single inline action button. Absent renders no action. */
  actionLabel?: string;
  /** The inline action button was activated. */
  onAction?: () => void;
  /** Whether the × is shown. Every layer gates the × on this member and never on whether anything listens for `close`, because Arena never derives what it draws from what a consumer listens for. */
  dismissible?: boolean;
  /** The × was activated. */
  onClose?: () => void;
}

const alertStyles = arenaStyles(manifest);
const TONES = Object.keys(manifest.variants.tone);
const GLYPHS: Record<string, string> = {
  info: 'ph-fill ph-info',
  success: 'ph-fill ph-check-circle',
  warning: 'ph-fill ph-warning',
  danger: 'ph-fill ph-warning-octagon',
  neutral: 'ph-fill ph-note',
};
type ArenaTone = keyof typeof manifest.variants.tone;
const toneOf = (tone: string | undefined): ArenaTone =>
  (tone && TONES.includes(tone) ? tone as ArenaTone : 'info');

export function Alert({ tone = 'info', title, children, icon, actionLabel, onAction, dismissible, onClose }: AlertProps) {
  const at = toneOf(tone);
  const styles = alertStyles({ tone: at, titled: Boolean(title) });
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={styles.root()}>
      <i className={`${icon || GLYPHS[at]} ${styles.icon()}`} />
      <div className={styles.body()}>
        {title && <div className={styles.title()}>{title}</div>}
        {children && <div className={styles.message()}>{children}</div>}
        {actionLabel && (
          <button onClick={onAction} className={styles.action()}>{actionLabel}</button>
        )}
      </div>
      {dismissible && (
        <button onClick={onClose} aria-label="Dismiss" className={styles.close()}>
          <i className="ph-bold ph-x" />
        </button>
      )}
    </div>
  );
}
