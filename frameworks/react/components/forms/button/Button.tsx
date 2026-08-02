import React, { useEffect, useState } from 'react';

import type { ButtonType, ButtonVariant, ControlSize } from '../../../Api.generated';

export interface ButtonProps {

  /** The button's label. Sits between the two icons when both are given. */
  children?: React.ReactNode;
  /** Which action this is. Danger is outline, never filled. */
  variant?: ButtonVariant;
  /** Height, from the density tokens, so the button re-densifies inside .arena-compact. */
  size?: ControlSize;

  /** Phosphor class name drawn before the label. Replaced by the spinner while loading. */
  icon?: string;

  /** Phosphor class name drawn after the label: a caret on a menu trigger, an arrow on a next action. */
  iconRight?: string;

  /** Replaces the leading icon with a spinner and blocks activation. The spin slows under reduced motion rather than stopping: a frozen spinner reads as a hung process. */
  loading?: boolean;

  /** Stretches to the container's width. */
  full?: boolean;
  /** Blocks activation and dims the control. Implied by loading. */
  disabled?: boolean;

  /** Native button behaviour. Defaults to 'button' so a button inside a form does not submit it by accident. */
  type?: ButtonType;

  /** Submitted with the form, when the button submits one. */
  name?: string;

  /** The value submitted under `name`. */
  value?: string;

  /** Focused on mount. */
  autoFocus?: boolean;

  /** The id of the form this button belongs to, when it is not a descendant of it. */
  form?: string;

  /** Whether the control is reached from the page's Tab sequence. Set false when it lives inside a composite that manages its own focus (a grid with a roving tab stop, a menu), where reaching it by Tab would be a second way in. Arena writes tabindex="-1" and the control stays programmatically focusable; a positive tab order is not expressible and never should be. Table's actions column is where this one is needed: a Button inside a row of a grid. */
  tabStop?: boolean;

  /** The button was activated, by pointer or by keyboard. */
  onClick?: () => void;
}


let injected = false;
function useSpinKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-button', '');
    s.textContent =
      '@keyframes arena-btn-spin{to{transform:rotate(360deg)}}' +
      '.arena-btn-spin{animation:arena-btn-spin var(--loop-spin) linear infinite}' +
      '@media (prefers-reduced-motion:reduce){.arena-btn-spin{animation-duration:var(--loop-reduced)}}' +
      '.arena-btn-press{transform:scale(var(--press-scale))}' +
      '@media (prefers-reduced-motion:reduce){.arena-btn-press{transform:none}}';
    document.head.appendChild(s);
  }, []);
}

const SIZES = {
  sm: { padding: '0 calc(var(--sp-1) * 3)', height: 'var(--dz-ctl-h-sm)', fontSize: 'var(--dz-text-md)' },
  md: { padding: '0 calc(var(--sp-1) * 4.5)', height: 'var(--dz-ctl-h)', fontSize: 'var(--dz-text)' },
  lg: { padding: '0 calc(var(--sp-1) * 6.5)', height: 'var(--dz-ctl-h-lg)', fontSize: 'var(--dz-text)' },
};

export function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  disabled = false, loading = false, full = false,
  type = 'button', name, value, autoFocus = false, form, onClick, tabStop = true,
}: ButtonProps) {
  useSpinKeyframes();
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const s = SIZES[size] || SIZES.md;

  const palettes = {
    primary: {
      bg: hover ? 'var(--crimson-strong)' : 'var(--crimson)',
      color: 'var(--on-accent)', border: 'transparent',
      shadow: hover ? 'var(--shadow-2)' : 'none',
    },
    secondary: {
      bg: hover ? 'var(--color-base-300)' : 'var(--panel)',
      color: 'var(--bone)', border: 'var(--line-strong)', shadow: 'none',
    },
    ghost: {
      bg: hover ? 'var(--panel)' : 'transparent',
      color: 'var(--bone-dim)', border: 'transparent', shadow: 'none',
    },
    danger: {
      bg: hover ? 'var(--danger-soft)' : 'transparent',
      color: 'var(--danger)', border: 'var(--danger)', shadow: 'none',
    },
  };
  const p = palettes[variant] || palettes.primary;

  return (
    <button
      className={active ? 'arena-btn-press' : undefined}
      type={type}
      name={name}
      value={value}
      autoFocus={autoFocus}
      form={form}
      onClick={onClick}

      tabIndex={tabStop ? undefined : -1}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--sp-1) * 2)',
        width: full ? '100%' : 'auto',
        height: s.height, padding: s.padding, fontSize: s.fontSize,
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
        letterSpacing: 'var(--ls-normal)',
        color: p.color, background: p.bg,
        border: 'var(--bw) solid ' + p.border, borderRadius: 'var(--r-sm)',
        boxShadow: p.shadow, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-mid) var(--ease-out)',
      }}
    >
      {loading
        ? <span className="arena-btn-spin" aria-hidden="true" style={{ width: 'calc(var(--sp-1) * 3.5)', height: 'calc(var(--sp-1) * 3.5)', border: 'var(--bw-strong) solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
        : icon && <i className={icon} aria-hidden="true" />}
      {children}
      {iconRight && <i className={iconRight} aria-hidden="true" />}
    </button>
  );
}
