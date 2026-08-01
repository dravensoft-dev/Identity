import React, { useEffect } from 'react';

import type { Orientation, SwitchSize } from '../../../Api.generated';

export interface SwitchProps {
  state?: boolean;
  orientation?: Orientation;
  size?: SwitchSize;
  iconOn?: string;
  iconOff?: string;
  label: string;
  disabled?: boolean;
  confirm?: boolean;
  onFuncOn?: () => void;
  onFuncOff?: () => void;
  onRequestChange?: () => void;
}


let injected = false;
function useKnobTransition() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-switch', '');
    s.textContent =
      '.arena-switch-knob{transition:transform var(--dur-mid) var(--ease-out)}' +
      '@media (prefers-reduced-motion:reduce){.arena-switch-knob{transition:none}}';
    document.head.appendChild(s);
  }, []);
}

const SIZES = {
  sm:  { track: 'calc(var(--sp-1) * 8)',  cross: 'calc(var(--sp-1) * 4.5)', knob: 'calc(var(--sp-1) * 3.5)', icon: 'calc(var(--sp-1) * 2.25)' },
  md:  { track: 'calc(var(--sp-1) * 10)', cross: 'calc(var(--sp-1) * 5.5)', knob: 'calc(var(--sp-1) * 4.5)', icon: 'calc(var(--sp-1) * 2.75)' },
  lg:  { track: 'calc(var(--sp-1) * 12)', cross: 'calc(var(--sp-1) * 6.5)', knob: 'calc(var(--sp-1) * 5.5)', icon: 'calc(var(--sp-1) * 3.25)' },
  xl:  { track: 'calc(var(--sp-1) * 14)', cross: 'calc(var(--sp-1) * 7.5)', knob: 'calc(var(--sp-1) * 6.5)', icon: 'calc(var(--sp-1) * 3.75)' },
  '2xl': { track: 'calc(var(--sp-1) * 16)', cross: 'calc(var(--sp-1) * 8.5)', knob: 'calc(var(--sp-1) * 7.5)', icon: 'calc(var(--sp-1) * 4.25)' },
};
const PAD = 'calc(var(--sp-1) * 0.5)';

export function Switch({
  state = false, orientation = 'horizontal', size = 'md',
  iconOn, iconOff, label, disabled = false, confirm = false,
  onFuncOn, onFuncOff, onRequestChange,
}: SwitchProps) {
  if (!label) throw new Error('Switch: `label` is required (a switch must have an accessible name)');
  const dims = SIZES[size] || SIZES.md;
  const vertical = orientation === 'vertical';
  useKnobTransition();
  const icon = state ? iconOn : iconOff;

  const activate = () => {
    if (disabled) return;
    if (confirm) { onRequestChange && onRequestChange(); return; }
    if (state) { onFuncOff && onFuncOff(); } else { onFuncOn && onFuncOn(); }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', opacity: disabled ? 0.5 : 1 }}>
      <button type="button" role="switch" aria-checked={state} aria-label={label} disabled={disabled} onClick={activate}
        style={{
          display: 'inline-flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', justifyContent: 'flex-start',
          width: vertical ? dims.cross : dims.track, height: vertical ? dims.track : dims.cross,
          padding: PAD, border: 'none', borderRadius: 'var(--r-pill)',
          background: state ? 'var(--crimson)' : 'var(--line-strong)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background var(--dur-mid) var(--ease-out)',
        }}>
        <span aria-hidden="true" className="arena-switch-knob" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          width: dims.knob, height: dims.knob, borderRadius: '50%', background: 'var(--on-accent)',
          transform: state
            ? (vertical ? 'translateY(100%)' : 'translateX(100%)')
            : (vertical ? 'translateY(0)' : 'translateX(0)'),
        }}>
          {icon && <i aria-hidden="true" className={icon} style={{ fontSize: dims.icon, lineHeight: 'var(--lh-tight)', color: 'var(--crimson)' }} />}
        </span>
      </button>
      {label && (
        <span onClick={activate} style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', color: 'var(--bone-dim)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
          {label}
          {confirm && <i className="ph-bold ph-shield-check" aria-hidden="true" title="Requires confirmation" style={{ fontSize: 'var(--icon-sm)', color: 'var(--mute)' }} />}
        </span>
      )}
    </span>
  );
}
