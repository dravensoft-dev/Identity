import React, { useId, useRef, useState } from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './ConfirmDialog.classes.generated.ts';
import { Button } from '../../forms/button/Button.tsx';
import { useDialogModal } from '../../../UseDialogModal.ts';

export interface ConfirmDialogProps {
  /** Whether the dialog is shown. The host owns it, as in the other three modals: defaulting it would let a ConfirmDialog whose open was never wired render nothing forever and look like a working closed dialog. */
  open: boolean;
  /** The dialog was dismissed -- by the Cancel action or by the Escape key, in both layers. A scrim click is deliberately NOT one of them: this component never closes on click-outside. No payload. */
  onCancel?: () => void;
  /** The action was confirmed. */
  onConfirm?: () => void;

  /** The dialog heading, and the name the panel's aria-labelledby points at. Required: nothing can derive a name for a confirmation, because its subject is editorial, and a modal announcing only its role is worse than none at all. */
  title: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** The dialog body: the question and any detail. */
  children?: React.ReactNode;
  /** The confirm button's label. */
  confirmLabel?: string;
  /** The cancel button's label. */
  cancelLabel?: string;
  /** Gives the confirm button Arena's only filled danger surface. */
  destructive?: boolean;
  /** Locks the confirm button until this exact word is typed. */
  requireText?: string;
}


const confirmStyles = arenaStyles(manifest);

export function ConfirmDialog({ open, onCancel, onConfirm, title, eyebrow = 'Confirm', children,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, requireText }: ConfirmDialogProps) {

  if (!title) throw new Error('ConfirmDialog: `title` is required');
  if (open == null) throw new Error('ConfirmDialog: `open` is required');
  const [typed, setTyped] = useState('');

  const panelRef = useRef<HTMLDivElement | null>(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onCancel });

  const titleId = useId();
  if (!open) return null;
  const locked = requireText ? typed.trim() !== requireText : false;
  const styles = confirmStyles({ destructive, invalid: locked && typed !== '', open: true });
  return (
    <div className={styles.root()}>
      <div role="alertdialog" aria-modal="true"
        ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} aria-labelledby={titleId}
        className={styles.panel()}>
        <div className={styles.head()}>
          <div className={styles.eyebrow()}>{eyebrow}</div>
          <div id={titleId} className={styles.title()}>{title}</div>
        </div>
        <div className={styles.body()}>
          {children}
          {requireText && (
            <div className={styles.requireBlock()}>
              <div className={styles.requireLabel()}>Type "{requireText}" to confirm</div>
              <input value={typed} onChange={(e) => setTyped(e.target.value)}
                className={styles.input()} />
            </div>
          )}
        </div>
        <div className={styles.foot()}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <button type="button" onClick={onConfirm} disabled={locked} className={styles.confirm()}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
