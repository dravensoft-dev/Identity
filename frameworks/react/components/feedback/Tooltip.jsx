import React, { useEffect, useState } from 'react';

/* Keyframes cannot be expressed in an inline style object, so they ship as a
 * <style> injected once into the head — the pattern ProgressBar establishes.
 * Only the keyframes are injected; the `animation` shorthand stays inline,
 * because nothing here needs a selector. No reduced-motion clause on purpose:
 * this animates opacity and nothing else, so there is no motion to reduce. */
let injected = false;
function useFadeKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-tooltip', '');
    s.textContent = '@keyframes arena-fade{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(s);
  }, []);
}

export function Tooltip({ children, content, style }) {
  useFadeKeyframes();
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(calc(var(--sp-2) * -1))',
          whiteSpace: 'nowrap', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)', background: 'var(--bone)', color: 'var(--ink)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', zIndex: 'var(--z-tooltip)',
          animation: 'arena-fade var(--dur-fast) var(--ease-out)' }}>
          {content}
        </span>
      )}
    </span>
  );
}
