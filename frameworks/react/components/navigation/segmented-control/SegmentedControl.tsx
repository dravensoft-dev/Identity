import React, { useState } from 'react';

import type { SegmentOption, SegmentedControlSize } from '../../../Api.generated';

export type { SegmentOption };
export interface SegmentedControlProps {

  /** The options, in order. Two to four with one-word labels. */
  options: SegmentOption[];

  /** The selected option's value. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;

  /** The initially selected value when uncontrolled. Defaults to the first option. */
  defaultValue?: string;

  /** Compact or default. */
  size?: SegmentedControlSize;

  /** Names what is being filtered — "Time range", not "Filter". A radio group with no accessible name is announced unlabelled. */
  ariaLabel: string;

  /** Shared name for the underlying radios; generated when omitted. */
  name?: string;

  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}


const SIZES = {
  sm: { height: 'calc(var(--sp-1) * 7)', padding: '0 calc(var(--sp-1) * 2.5)', fontSize: 'var(--dz-text-sm)' },
  md: { height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3.5)', fontSize: 'var(--dz-text-md)' },
};

export function SegmentedControl({
  options, value, defaultValue, onChange,
  size = 'md', ariaLabel, name,
}: SegmentedControlProps) {
  if (options == null) throw new Error('SegmentedControl: `options` is required');
  if (!ariaLabel) throw new Error('SegmentedControl: `ariaLabel` is required');
  const [internal, setInternal] = useState(defaultValue ?? (options[0] && options[0].value));
  const [focus, setFocus] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [autoName] = useState(() => 'sc-' + Math.random().toString(36).slice(2, 7));

  const selected = value ?? internal;
  const s = SIZES[size] || SIZES.md;
  const gname = name || autoName;
  const select = (v: string) => { setInternal(v); onChange && onChange(v); };

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
      }}
    >
      {options.map((o) => {
        const v = o.value;
        const label = o.label;
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
