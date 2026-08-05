import React, { useId, useRef } from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './ArenaDialog.classes.generated.ts';
import { useDialogModal } from '../../../UseDialogModal.ts';

export interface ArenaDialogProps {

  /** Whether the dialog is shown. The host owns it. */
  open: boolean;

  /** Names the dialog for assistive technology and heads it visually. Required: aria-labelledby points at it, and a modal with no name is worse than none at all. */
  title: string;

  /** A short kicker above the title. */
  eyebrow?: string;

  /** A CSS width for the panel. It defaults to 480px, which each layer reaches in its own idiom, and the input overrides whichever. */
  width?: string;

  /** The dialog's body. */
  children?: React.ReactNode;

  /** The action row, right-aligned. */
  footer?: React.ReactNode;

  /** The dialog was dismissed -- by Escape or by a scrim click. No payload. */
  onClose?: () => void;
}


const arenaDialogStyles = arenaStyles(manifest);

export function ArenaDialog({ open, onClose, title, eyebrow, children, footer, width }: ArenaDialogProps) {

  if (!title) throw new Error('ArenaDialog: `title` is required');

  if (open == null) throw new Error('ArenaDialog: `open` is required');

  const panelRef = useRef<HTMLDivElement | null>(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onClose });

  const titleId = useId();
  if (!open) return null;
  const styles = arenaDialogStyles({ open: true });
  return (
    <div onClick={onClose} className={styles.scrim()}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} aria-labelledby={titleId}
        className={styles.panel()} style={{ width }}>
        <div className={styles.head()}>
          {eyebrow && <div className={styles.eyebrow()}>{eyebrow}</div>}
          <div id={titleId} className={styles.title()}>{title}</div>
        </div>
        <div className={styles.body()}>{children}</div>
        {footer && <div className={styles.foot()}>{footer}</div>}
      </div>
    </div>
  );
}
