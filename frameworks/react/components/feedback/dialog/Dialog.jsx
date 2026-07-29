import React, { useEffect, useId, useRef } from 'react';
import { useDialogModal } from '../../../UseDialogModal.js';

/* Keyframes cannot be expressed in an inline style object, so they ship as a
 * <style> injected once into the head — the pattern ProgressBar establishes.
 * Only the keyframes are injected; the `animation` shorthand stays inline,
 * because the reduced-motion variant redefines the keyframes rather than
 * needing a selector. Under reduce the dialog still fades, it just stops
 * travelling: the movement is the vestibular trigger, the fade is the meaning. */
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

export function Dialog({ open, onClose, title, eyebrow, children, footer, width = 'calc(var(--sp-1) * 120)' }) {
  /* `title` is required because the dialog names itself with it: aria-labelledby
   * points at the title element, and a modal announcing only "dialog" is the
   * roles.label defect this component carried until plan 8C4. Nothing can derive
   * a name for a dialog -- its subject is editorial -- so it is guarded rather
   * than defaulted, the Table.label / SegmentedControl.ariaLabel shape. */
  if (!title) throw new Error('Dialog: `title` is required');
  /* `open` is required too, and `== null` rather than `!open`: `false` is the
   * closed state a host legitimately passes, so only absence is the defect.
   * This is api/README.md's runtime half of required-ness, and the shape
   * CommandPalette and Onboarding already use for the same member. */
  if (open == null) throw new Error('Dialog: `open` is required');
  usePopKeyframes();
  /* EVERY hook below runs BEFORE the `if (!open)` early return. useDialogModal
   * calls useEffect and useRef of its own, so hoisting it under the return would
   * change the hook count on the render where `open` flips and crash React. */
  const panelRef = useRef(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onClose });
  /* useId, never a Math.random() id: this component is also rendered through
   * renderToStaticMarkup, and a random id would differ between the server and
   * client renders and break the aria-labelledby it exists to carry. */
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
          {/* Unconditional, and the `title &&` that used to wrap it is gone: the
              guard above makes it dead, and a reader meeting it would conclude
              title was still optional while aria-labelledby pointed at nothing. */}
          <div id={titleId} style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', letterSpacing: 'var(--ls-tight)' }}>{title}</div>
        </div>
        <div style={{ padding: 'calc(var(--sp-1) * 4) calc(var(--sp-1) * 6)', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'calc(var(--sp-1) * 2.5)', padding: '0 calc(var(--sp-1) * 6) calc(var(--sp-1) * 5.5)' }}>{footer}</div>}
      </div>
    </div>
  );
}
