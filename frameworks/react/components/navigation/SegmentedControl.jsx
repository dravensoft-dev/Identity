import React, { useState } from 'react';

/**
 * Compact inline filter over a set of mutually exclusive options.
 *
 * Deliberately not a Tabs look-alike: Tabs navigates between views and marks the
 * active one with the crimson underline; this marks the selected option with a
 * neutral raised thumb inside an enclosed track. A filter must not spend the
 * view's single primary accent (see README → VISUAL FOUNDATIONS), and the solid
 * crimson fill stays reserved for the primary action.
 *
 * Semantics are a real radio group — a hidden native input per segment inside a
 * `role="radiogroup"` track. The browser then owns the keyboard (one tab stop,
 * arrows move and select) and focus always coincides with selection, which is
 * why the gold focus ring can sit on the track the way Input and Select wear it.
 */

const SIZES = {
  sm: { height: 'calc(var(--sp-1) * 7)', padding: '0 calc(var(--sp-1) * 2.5)', fontSize: 'var(--dz-text-sm)' },
  md: { height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3.5)', fontSize: 'var(--dz-text-md)' },
};

export function SegmentedControl({
  options = [], value, defaultValue, onChange,
  size = 'md', ariaLabel, name, style, ...rest
}) {
  const [internal, setInternal] = useState(defaultValue ?? (options[0] && (options[0].value ?? options[0])));
  const [focus, setFocus] = useState(false);
  const [hover, setHover] = useState(null);
  const [autoName] = useState(() => 'sc-' + Math.random().toString(36).slice(2, 7));

  const selected = value ?? internal;
  const s = SIZES[size] || SIZES.md;
  const gname = name || autoName;
  const select = (v) => { setInternal(v); onChange && onChange(v); };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 0.5)', padding: 'calc(var(--sp-1) * 1)',
        background: 'var(--surface-input)',
        border: 'var(--bw) solid ' + (focus ? 'var(--gold)' : 'var(--color-base-300)'),
        borderRadius: 'var(--r-sm)',
        boxShadow: focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none',
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {options.map((o) => {
        const v = o.value ?? o;
        const label = o.label ?? o;
        const on = v === selected;
        return (
          <label
            key={v}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(null)}
            style={{
              position: 'relative',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: s.height, padding: s.padding, borderRadius: 'var(--r-xs)',
              fontFamily: 'var(--font-body)', fontSize: s.fontSize,
              fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              background: on ? 'var(--line-strong)' : 'transparent',
              color: on ? 'var(--bone)' : hover === v ? 'var(--bone-dim)' : 'var(--mute)',
              boxShadow: on ? 'var(--shadow-1)' : 'none',
              cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
              transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
            }}
          >
            {label}
            <input
              type="radio" name={gname} value={v} checked={on}
              onChange={() => select(v)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </label>
        );
      })}
    </div>
  );
}
