import React, { useEffect, useId, useRef, useState } from 'react';
import { delayOpen, delayClose } from '../../tokens.generated.js';

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

export function Tooltip({ children, label }) {
  if (!label) throw new Error('Tooltip: `label` is required');
  useFadeKeyframes();
  const [show, setShow] = useState(false);
  /* The colons useId() returns are legal in an id attribute and a SyntaxError in
   * a CSS selector; stripping them keeps the bubble addressable. */
  const bubbleId = `tooltip-${useId().replace(/:/g, '')}`;
  /* One timer, cleared on every transition. Two timers would race: leaving and
   * re-entering inside the close grace period must cancel the pending close, not
   * queue an open behind it. */
  const timer = useRef(null);
  const clear = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } };
  const schedule = (next, ms) => { clear(); timer.current = setTimeout(() => setShow(next), ms); };
  /* THE DELAYS ARE POINTER INTENT AND FOCUS MUST NOT ROUTE THROUGH THEM. A
   * keyboard user has already paid to reach this control; making them wait
   * --delay-open on top of that reads as an unresponsive widget. The token's own
   * $description says exactly this, and it also clears any pending pointer timer
   * so a focus arriving inside a close grace period is not undone by it. */
  const now = (next) => { clear(); setShow(next); };
  useEffect(() => () => clear(), []);
  /* ESCAPE IS LISTENED FOR ON THE DOCUMENT, and a handler on the wrapper is not a
   * substitute. A wrapper's onKeyDown only sees keydowns whose target is inside
   * it -- true of a FOCUS reveal and false of a POINTER one, which leaves focus
   * wherever it already was, so a hover-revealed tooltip was undismissable from
   * the keyboard. That is a WCAG 1.4.13 failure (content on hover must be
   * dismissible) and not only a gap in the `tooltip` pattern.
   *
   * Bound only while the bubble is up, and torn down when it hides and on
   * unmount, so nothing listens for the whole life of a page full of triggers.
   * The document guard keeps the server pass untouched. */
  useEffect(() => {
    if (!show || typeof document === 'undefined') return undefined;
    const onEscape = (e) => { if (e.key === 'Escape') now(false); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [show]);
  /* aria-describedby is added to the CONSUMER's element, so it requires an element
   * that accepts props -- the same one-hop cloneElement limit the compound families
   * carry. A fragment or a component that swallows its props breaks the wiring, and
   * Tooltip.prompt.md says so. It is added only while the bubble exists: an IDREF
   * pointing at nothing is worse than no IDREF at all.
   *
   * MERGED, never overwritten. The attribute is a space-separated ID LIST, which
   * is the whole point of it -- a trigger may already be described by something of
   * the consumer's, an input's password rules being the ordinary case, and
   * cloneElement assigning over that took it away silently and permanently, in the
   * hidden state as well as the shown one. */
  const own = React.isValidElement(children) ? children.props['aria-describedby'] : undefined;
  const describedBy = show ? [own, bubbleId].filter(Boolean).join(' ') : own;
  const described = React.isValidElement(children)
    ? React.cloneElement(children, { 'aria-describedby': describedBy })
    : children;
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => schedule(true, delayOpen)}
      onMouseLeave={() => schedule(false, delayClose)}
      onFocus={() => now(true)}
      onBlur={() => now(false)}>
      {described}
      {show && (
        <span role="tooltip" id={bubbleId} style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(calc(var(--sp-2) * -1))',
          whiteSpace: 'nowrap', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)', background: 'var(--bone)', color: 'var(--ink)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)', zIndex: 'var(--z-tooltip)',
          animation: 'arena-fade var(--dur-fast) var(--ease-out)' }}>
          {label}
        </span>
      )}
    </span>
  );
}
