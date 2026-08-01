import React, { useState } from 'react';

import type { ButtonType, ControlSize, IconButtonVariant } from '../../../Api.generated';

export interface IconButtonProps {

  /** Phosphor class name, e.g. 'ph-bold ph-plus'. Arena draws the <i> and hides it from assistive technology; `label` is the accessible name. */
  icon: string;

  /** The accessible name, present in every state. Also the visible text when showLabel is set, and the title attribute when it is not. */
  label: string;
  /** Height, from the density tokens — the same scale Button uses, so the two re-densify together in a toolbar. */
  size?: ControlSize;
  /** Visual treatment. */
  variant?: IconButtonVariant;

  /** Whether this control is a toggle, and whether it is currently on. Present, Arena writes aria-pressed and draws the on state with the same accent tint a current SideNav item takes, so "this one is on" is one statement across the library; absent, the control is not a toggle at all. The tri-state is the point and a default of false would destroy it: aria-pressed="false" on a plain button announces a toggle that is off rather than a button, so every IconButton in the system would announce as an unpressed toggle. The label does NOT change with the state, which is what the button pattern means by a toggle: a control that renames itself is announced as a different control rather than as the same one in another state. */
  pressed?: boolean;

  /** Shows the label as text beside the icon (H6). Don't rely on the title alone on touch or keyboard surfaces. */
  showLabel?: boolean;
  /** Blocks activation and dims the control. */
  disabled?: boolean;

  /** Native button behaviour. Defaults to 'button' so an icon button inside a form does not submit it by accident. */
  type?: ButtonType;

  /** Submitted with the form, when the button submits one. */
  name?: string;

  /** The value submitted under `name`. */
  value?: string;

  /** Focused on mount. */
  autoFocus?: boolean;

  /** The id of the form this button belongs to, when it is not a descendant of it. */
  form?: string;

  /** Whether the control is reached from the page's Tab sequence. Set false when it lives inside a composite that manages its own focus — a grid with a roving tab stop, a menu — where reaching it by Tab would be a second way in. Arena writes tabindex="-1" and the control stays programmatically focusable; a positive tab order is not expressible and never should be. */
  tabStop?: boolean;

  /** The button was activated, by pointer or by keyboard. */
  onClick?: () => void;
}


const SZ = { sm: 'var(--dz-ctl-h-sm)', md: 'var(--dz-ctl-h)', lg: 'var(--dz-ctl-h-lg)' };

export function IconButton({
  icon, label, size = 'md', variant = 'ghost', pressed, showLabel = false, disabled = false,
  type = 'button', name, value, autoFocus = false, form, onClick, tabStop = true,
}: IconButtonProps) {
  if (!icon) throw new Error('IconButton: `icon` is required');
  if (!label) throw new Error('IconButton: `label` is required');
  const [hover, setHover] = useState(false);
  const d = SZ[size] || SZ.md;
  const bg = pressed
    ? (hover ? 'color-mix(in oklab, var(--crimson) 22%, transparent)' : 'color-mix(in oklab, var(--crimson) 14%, transparent)')
    : variant === 'solid'
      ? (hover ? 'var(--crimson-strong)' : 'var(--crimson)')
      : (hover ? 'var(--panel)' : 'transparent');
  const color = pressed ? 'var(--crimson)' : variant === 'solid' ? 'var(--on-accent)' : 'var(--bone-dim)';
  const border = pressed
    ? 'var(--bw) solid color-mix(in oklab, var(--crimson) 38%, transparent)'
    : variant === 'solid' ? 'none' : 'var(--bw) solid var(--color-base-300)';
  return (
    <button type={type} name={name} value={value} autoFocus={autoFocus} form={form} onClick={onClick}

      tabIndex={tabStop ? undefined : -1}
      aria-label={label} aria-pressed={pressed} title={showLabel ? undefined : label} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ height: d, width: showLabel ? 'auto' : d, minWidth: d, padding: showLabel ? '0 calc(var(--sp-1) * 3.5) 0 var(--sp-3)' : 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: showLabel ? 'var(--sp-2)' : 0,
        background: bg, color, border,
        borderRadius: 'var(--r-sm)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out)' }}>
      <i className={icon} aria-hidden="true" />
      {showLabel && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text)', lineHeight: 'var(--dz-lh)' }}>{label}</span>}
    </button>
  );
}
