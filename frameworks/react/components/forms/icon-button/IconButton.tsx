import React, { useState } from 'react';

import type { ButtonType, ControlSize, IconButtonVariant } from '../../../Api.generated';

export interface IconButtonProps {

  icon: string;

  label: string;
  size?: ControlSize;
  variant?: IconButtonVariant;

  showLabel?: boolean;
  disabled?: boolean;

  type?: ButtonType;

  name?: string;

  value?: string;

  autoFocus?: boolean;

  form?: string;

  tabStop?: boolean;

  onClick?: () => void;
}


const SZ = { sm: 'var(--dz-ctl-h-sm)', md: 'var(--dz-ctl-h)', lg: 'var(--dz-ctl-h-lg)' };

export function IconButton({
  icon, label, size = 'md', variant = 'ghost', showLabel = false, disabled = false,
  type = 'button', name, value, autoFocus = false, form, onClick, tabStop = true,
}: IconButtonProps) {
  if (!icon) throw new Error('IconButton: `icon` is required');
  if (!label) throw new Error('IconButton: `label` is required');
  const [hover, setHover] = useState(false);
  const d = SZ[size] || SZ.md;
  const bg = variant === 'solid'
    ? (hover ? 'var(--crimson-strong)' : 'var(--crimson)')
    : (hover ? 'var(--panel)' : 'transparent');
  const color = variant === 'solid' ? 'var(--on-accent)' : 'var(--bone-dim)';
  return (
    <button type={type} name={name} value={value} autoFocus={autoFocus} form={form} onClick={onClick}

      tabIndex={tabStop ? undefined : -1}
      aria-label={label} title={showLabel ? undefined : label} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ height: d, width: showLabel ? 'auto' : d, minWidth: d, padding: showLabel ? '0 calc(var(--sp-1) * 3.5) 0 var(--sp-3)' : 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: showLabel ? 'var(--sp-2)' : 0,
        background: bg, color, border: variant === 'solid' ? 'none' : 'var(--bw) solid var(--color-base-300)',
        borderRadius: 'var(--r-sm)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out)' }}>
      <i className={icon} aria-hidden="true" />
      {showLabel && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text)', lineHeight: 'var(--dz-lh)' }}>{label}</span>}
    </button>
  );
}
