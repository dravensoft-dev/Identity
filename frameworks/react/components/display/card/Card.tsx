import React, { useState } from 'react';

export interface CardProps {

  children?: React.ReactNode;
  title?: string;
  eyebrow?: string;

  action?: React.ReactNode;
  floating?: boolean;
  accent?: boolean;

  interactive?: boolean;
  disabled?: boolean;

  onClick?: () => void;
}

export function Card({
  children, title, eyebrow, action, floating = false, accent = false,
  interactive = false, disabled = false, onClick,
}: CardProps) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);

  const activate = () => {
    if (interactive && !disabled) onClick?.();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    activate();
  };

  const live = interactive && !disabled;
  return (
    <div role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
      aria-disabled={interactive && disabled ? true : undefined}
      onClick={interactive ? activate : undefined} onKeyDown={interactive ? onKeyDown : undefined}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ background: live && hover ? 'var(--panel)' : 'var(--surface-card)',
        border: 'var(--bw) solid ' + (accent ? 'var(--crimson)' : 'var(--color-base-300)'),
        borderRadius: 'var(--r-lg)', boxShadow: floating ? 'var(--shadow-2)' : 'none',
        outline: live && focus ? 'var(--bw-2) solid var(--crimson)' : 'none',
        outlineOffset: focus ? 'var(--sp-1)' : 0,
        cursor: interactive ? (disabled ? 'not-allowed' : 'pointer') : 'auto',
        opacity: interactive && disabled ? 0.45 : 1,
        textAlign: 'left',
        transition: 'background var(--dur-fast) var(--ease-out)',
        overflow: 'hidden' }}>
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
    </div>
  );
}
