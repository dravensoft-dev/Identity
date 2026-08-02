import React, { useState } from 'react';
import { isPrimaryActivation } from '../../../AnchorActivation.ts';

export interface CardProps {

  /** The card's body, below the optional header. */
  children?: React.ReactNode;
  /** Header title. Absent, along with eyebrow and action, renders no header block at all. */
  title?: string;
  /** Mono uppercase label above the title, in the accent colour. */
  eyebrow?: string;

  /** Right-aligned in the header, beside the title. Arena draws the header row; the consumer draws what sits in it. */
  action?: React.ReactNode;
  /** Adds the warm shadow. Depth comes from the shadow and the surface scale, never a gradient. */
  floating?: boolean;
  /** Draws the border in the accent colour instead of the surface hairline. */
  accent?: boolean;

  /** Whether the whole card is one activation target, which is the ordinary shape of a list on a phone. A boolean rather than "is `click` bound?" -- R6, the same reason TableRow.interactive is one. An interactive card is a role="button" tab stop with an Enter/Space handler and the surface's own hover and focus states; a non-interactive one is inert and adds no tab stop, because a dead stop on every card of every list is worse than the gap it would close. It is a ROLE rather than a <button> element for the same reason TableRow's card shape is: a card body may hold controls of its own, and a control inside a control is reachable by nobody. */
  interactive?: boolean;
  /** Whether an interactive card is drawn but cannot be activated. It reflects through aria-disabled rather than any native attribute, and the card stays in the tab order rather than leaving it, because a disabled control nobody can reach is a control nobody knows exists. Without `interactive` there is nothing to disable and the card is inert already. */
  disabled?: boolean;

  /** Present => the card renders an <a>; absent, with `interactive`, a role="button". The same split, and the same reason, as SideNavItem.href: a control that navigates must be a link, openable in a new tab, address copyable, announced as a link, and none of that can be rebuilt on a div. A primary click with no modifier is cancelled and reported through `click`, so a router owns it; ctrl, meta, shift, alt, a middle click and a context menu stay the browser's and report nothing. It implies interaction on its own, so `interactive` is not also required, and with `disabled` it refuses activation through aria-disabled the way an item does. The card's own content still holds whatever controls it holds; a control inside the anchor is a control inside a link, which is the price of making the whole surface the target and the reason `interactive` exists as the alternative. */
  href?: string;

  /** An interactive card was activated, by pointer or by Enter or Space. With `href` it is also how the card reports the one activation a router owns, a primary click or Enter with no modifier, and Arena has already cancelled the anchor's own navigation by the time it fires; a modified or middle click is the browser's and does not fire it at all. No payload, because the consumer wrote this element and already holds what it is about. */
  onClick?: () => void;
}

export function Card({
  children, title, eyebrow, action, floating = false, accent = false,
  interactive = false, disabled = false, href, onClick,
}: CardProps) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);

  const target = href !== undefined;
  const acts = interactive || target;

  const activate = () => {
    if (acts && !disabled) onClick?.();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    activate();
  };

  const live = acts && !disabled;

  const shared = {
    'aria-disabled': acts && disabled ? true as const : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
      style: { background: live && hover ? 'var(--panel)' : 'var(--surface-card)',
        border: 'var(--bw) solid ' + (accent ? 'var(--crimson)' : 'var(--color-base-300)'),
        borderRadius: 'var(--r-lg)', boxShadow: floating ? 'var(--shadow-2)' : 'none',
        outline: live && focus ? 'var(--bw-2) solid var(--crimson)' : 'none',
        outlineOffset: focus ? 'var(--sp-1)' : 0,
        cursor: acts ? (disabled ? 'not-allowed' : 'pointer') : 'auto',
        opacity: acts && disabled ? 0.45 : 1,
        textAlign: 'left' as const,
        textDecoration: 'none',
        display: 'block',
        color: 'inherit',
        transition: 'background var(--dur-fast) var(--ease-out)',
        overflow: 'hidden' },
  };

  const body = (
    <>
      {(title || eyebrow || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 'calc(var(--sp-1) * 4.5) calc(var(--sp-1) * 5) 0' }}>
          <div>
            {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 1.5)' }}>{eyebrow}</div>}
            {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h4)', color: 'var(--bone)' }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 'calc(var(--sp-1) * 5)' }}>{children}</div>
    </>
  );

  if (target) {
    return (
      <a href={href} {...shared}
        onClick={(event) => {
          if (disabled) { event.preventDefault(); return; }
          if (!isPrimaryActivation(event)) return;
          event.preventDefault();
          activate();
        }}>
        {body}
      </a>
    );
  }

  return (
    <div role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? activate : undefined} onKeyDown={interactive ? onKeyDown : undefined}
      {...shared}>
      {body}
    </div>
  );
}
