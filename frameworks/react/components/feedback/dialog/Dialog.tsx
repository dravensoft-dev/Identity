import React, { useEffect, useId, useRef } from 'react';
import { useDialogModal } from '../../../UseDialogModal.ts';

export interface DialogProps {

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


let injected = false;
function usePopKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-dialog', '');
    s.textContent =
      '@keyframes arena-pop{from{opacity:0;transform:translateY(var(--sp-2)) scale(.98)}to{opacity:1;transform:none}}' +
      '@media (prefers-reduced-motion:reduce){@keyframes arena-pop{from{opacity:0}to{opacity:1}}}';
    document.head.appendChild(s);
  }, []);
}

export function Dialog({ open, onClose, title, eyebrow, children, footer, width = 'calc(var(--sp-1) * 120)' }: DialogProps) {

  if (!title) throw new Error('Dialog: `title` is required');

  if (open == null) throw new Error('Dialog: `open` is required');
  usePopKeyframes();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onClose });

  const titleId = useId();
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--scrim)', backdropFilter: 'blur(var(--scrim-blur))', WebkitBackdropFilter: 'blur(var(--scrim-blur))' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} aria-labelledby={titleId}
        style={{ width, maxWidth: '92vw', background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', overflow: 'hidden',
          animation: 'arena-pop var(--dur-mid) var(--ease-emphatic)' }}>
        <div style={{ padding: 'calc(var(--sp-1) * 5.5) calc(var(--sp-1) * 6) 0' }}>
          {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 2)' }}>{eyebrow}</div>}
          {

}
          <div id={titleId} style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', letterSpacing: 'var(--ls-tight)' }}>{title}</div>
        </div>
        <div style={{ padding: 'calc(var(--sp-1) * 4) calc(var(--sp-1) * 6)', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'calc(var(--sp-1) * 2.5)', padding: '0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5)' }}>{footer}</div>}
      </div>
    </div>
  );
}
