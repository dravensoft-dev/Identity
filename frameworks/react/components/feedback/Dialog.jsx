import React, { useEffect } from 'react';

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
      '@keyframes arena-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}' +
      '@media (prefers-reduced-motion:reduce){@keyframes arena-pop{from{opacity:0}to{opacity:1}}}';
    document.head.appendChild(s);
  }, []);
}

export function Dialog({ open, onClose, title, eyebrow, children, footer, width = 480 }) {
  usePopKeyframes();
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--scrim)', backdropFilter: 'blur(var(--scrim-blur))', WebkitBackdropFilter: 'blur(var(--scrim-blur))' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ width, maxWidth: '92vw', background: 'var(--surface-card)', border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', overflow: 'hidden',
          animation: 'arena-pop var(--dur-mid) var(--ease-emphatic)' }}>
        <div style={{ padding: '22px 24px 0' }}>
          {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 8 }}>{eyebrow}</div>}
          {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--bone)', letterSpacing: '-.01em' }}>{title}</div>}
        </div>
        <div style={{ padding: '16px 24px', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 24px 22px' }}>{footer}</div>}
      </div>
    </div>
  );
}
