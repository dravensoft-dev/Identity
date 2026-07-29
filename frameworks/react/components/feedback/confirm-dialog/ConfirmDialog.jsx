import React, { useId, useRef, useState } from 'react';
import { Button } from '../forms/Button.jsx';
import { useDialogModal } from '../../use-dialog-modal.js';
/** Confirmation of high-consequence actions. Does NOT close on click-outside (avoids losses).
 * `requireText` forces typing a word to enable the destructive action.
 *
 * Escape dismisses, and it reports through `onCancel` -- the component's own
 * dismissal channel, so no new member appears. The scrim stays inert on purpose:
 * a destructive confirmation must not be dismissable by a stray click, which is
 * the one thing Escape does NOT change. */
export function ConfirmDialog({ open = false, onCancel, onConfirm, title, eyebrow = 'Confirm', children,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, requireText }) {
  /* `title` is required because the dialog names itself with it: aria-labelledby
   * points at the title element, and a modal announcing only "alertdialog" is the
   * roles.label defect this component carried until plan 8C4. Nothing can derive
   * a name for a confirmation -- its subject is editorial -- so it is guarded
   * rather than defaulted, the Table.label / SegmentedControl.ariaLabel shape. */
  if (!title) throw new Error('ConfirmDialog: `title` is required');
  const [typed, setTyped] = useState('');
  /* EVERY hook below runs BEFORE the `if (!open)` early return. useDialogModal
   * calls useEffect and useRef of its own, so hoisting it under the return would
   * change the hook count on the render where `open` flips and crash React. */
  const panelRef = useRef(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onCancel });
  /* useId, never a Math.random() id: this component is also rendered through
   * renderToStaticMarkup, and a random id would differ between the server and
   * client renders and break the aria-labelledby it exists to carry. */
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
          {/* Unconditional, and the `title &&` that used to wrap it is gone: the
              guard above makes it dead, and a reader meeting it would conclude
              title was still optional while aria-labelledby pointed at nothing. */}
          <div id={titleId} style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', letterSpacing: 'var(--ls-tight)' }}>{title}</div>
        </div>
        <div style={{ padding: 'calc(var(--sp-1) * 4) calc(var(--sp-1) * 6)', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)' }}>
          {children}
          {requireText && (
            <div style={{ marginTop: 'calc(var(--sp-1) * 3.5)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 'calc(var(--sp-1) * 1.5)' }}>Type "{requireText}" to confirm</div>
              {/* No autoFocus: useDialogModal focuses the panel's first focusable on
                  open, and this input is exactly that in DOM order. Two mechanisms
                  aiming at one element is one too many -- the HTML autofocus
                  processing model skips the attribute once the document's
                  autofocus-processed flag is set, which is the reason Angular's own
                  focus-trap module records for never using a bare `autofocus`. */}
              <input value={typed} onChange={(e) => setTyped(e.target.value)}
                style={{ width: '100%', height: 'var(--dz-ctl-h)', boxSizing: 'border-box', padding: '0 calc(var(--sp-1) * 3)', background: 'var(--surface-input)',
                  border: 'var(--bw) solid ' + (locked && typed ? 'var(--danger)' : 'var(--color-base-300)'), borderRadius: 'var(--r-sm)',
                  color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text)', outline: 'none' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'calc(var(--sp-1) * 2.5)', padding: '0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5)' }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          {/* The point of no return: the only filled danger surface in Arena. Button
            * has no filled-danger variant by design — danger is outline everywhere
            * else, and a variant would put this fill one prop away from any caller.
            * So it stays a local override on the primary button, here and nowhere
            * else. --danger-fill, not --danger: --danger is tuned to be read as
            * text on the base surfaces, which leaves it too light to carry white.
            * --color-error-content, not --on-accent: the fill is danger's, and a
            * swapped skin can pair them differently. */}
          <Button variant="primary" onClick={onConfirm} disabled={locked}
            style={destructive ? { background: 'var(--danger-fill)', color: 'var(--color-error-content)' } : undefined}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
