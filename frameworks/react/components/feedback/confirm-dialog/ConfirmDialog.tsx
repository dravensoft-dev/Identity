import React, { useEffect, useId, useRef, useState } from 'react';
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


export function confirmStyle(destructive: boolean, hover: boolean, locked: boolean): React.CSSProperties {
  const filled = destructive
    ? { background: hover ? 'var(--danger-strong)' : 'var(--danger-fill)', color: 'var(--color-error-content)' }
    : { background: hover ? 'var(--crimson-strong)' : 'var(--crimson)', color: 'var(--on-accent)' };
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--sp-1) * 2)',
    height: 'var(--dz-ctl-h)', padding: '0 calc(var(--sp-1) * 4.5)', fontSize: 'var(--dz-text)',
    fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--ls-normal)',
    border: 'var(--bw) solid transparent', borderRadius: 'var(--r-sm)',
    boxShadow: hover ? 'var(--shadow-2)' : 'none',
    cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.45 : 1,
    transition: 'background var(--dur-fast) var(--ease-out), box-shadow var(--dur-mid) var(--ease-out)',
    ...filled,
  };
}

let injected = false;
function useConfirmFocusRing() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-confirm-dialog', '');
    s.textContent =
      '.arena-confirm-input:focus-visible{box-shadow:0 0 0 var(--focus-width) var(--danger)}';
    document.head.appendChild(s);
  }, []);
}

export function ConfirmDialog({ open, onCancel, onConfirm, title, eyebrow = 'Confirm', children,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, requireText }: ConfirmDialogProps) {

  if (!title) throw new Error('ConfirmDialog: `title` is required');
  if (open == null) throw new Error('ConfirmDialog: `open` is required');
  useConfirmFocusRing();
  const [typed, setTyped] = useState('');
  const [confirmHover, setConfirmHover] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onCancel });

  const titleId = useId();
  if (!open) return null;
  const locked = requireText ? typed.trim() !== requireText : false;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal-nested)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--scrim)', backdropFilter: 'blur(var(--scrim-blur))', WebkitBackdropFilter: 'blur(var(--scrim-blur))' }}>
      <div role="alertdialog" aria-modal="true"
        ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} aria-labelledby={titleId}
        style={{ width: 'calc(var(--sp-1) * 115)', maxWidth: '92vw', background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', overflow: 'hidden' }}>
        <div style={{ padding: 'calc(var(--sp-1) * 5.5) calc(var(--sp-1) * 6) 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: destructive ? 'var(--danger)' : 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 2)' }}>{eyebrow}</div>
          {

}
          <div id={titleId} style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', letterSpacing: 'var(--ls-tight)' }}>{title}</div>
        </div>
        <div style={{ padding: 'calc(var(--sp-1) * 4) calc(var(--sp-1) * 6)', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)' }}>
          {children}
          {requireText && (
            <div style={{ marginTop: 'calc(var(--sp-1) * 3.5)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 'calc(var(--sp-1) * 1.5)' }}>Type "{requireText}" to confirm</div>
              {

}
              <input value={typed} onChange={(e) => setTyped(e.target.value)}
                className="arena-confirm-input"
                style={{ width: '100%', height: 'var(--dz-ctl-h)', padding: '0 calc(var(--sp-1) * 3)', background: 'var(--surface-input)',
                  border: 'var(--bw) solid ' + (locked && typed ? 'var(--danger)' : 'var(--color-base-300)'), borderRadius: 'var(--r-sm)',
                  color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text)', outline: 'none' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'calc(var(--sp-1) * 2.5)', padding: '0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5)' }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          {

}
          <button type="button" onClick={onConfirm} disabled={locked}
            onMouseEnter={() => setConfirmHover(true)} onMouseLeave={() => setConfirmHover(false)}
            style={confirmStyle(destructive, confirmHover, locked)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
