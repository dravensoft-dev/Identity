import React, { useState } from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './SegmentedControl.manifest.generated.ts';

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

  /** Names what is being filtered: "Time range", not "Filter". A radio group with no accessible name is announced unlabelled. */
  ariaLabel: string;

  /** Shared name for the underlying radios; generated when omitted. */
  name?: string;

  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}


const segmentedStyles = tv(manifest);

export function SegmentedControl({
  options, value, defaultValue, onChange,
  size = 'md', ariaLabel, name,
}: SegmentedControlProps) {
  if (options == null) throw new Error('SegmentedControl: `options` is required');
  if (!ariaLabel) throw new Error('SegmentedControl: `ariaLabel` is required');
  const [internal, setInternal] = useState(defaultValue ?? (options[0] && options[0].value));
  const [autoName] = useState(() => 'sc-' + Math.random().toString(36).slice(2, 7));

  const selected = value ?? internal;
  const gname = name || autoName;
  const select = (v: string) => { setInternal(v); onChange && onChange(v); };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={segmentedStyles({ size }).track()}>
      {options.map((o) => {
        const v = o.value;
        const on = v === selected;
        const styles = segmentedStyles({ size, selected: on });
        return (
          <label key={v} className={styles.segment()}>
            {o.label}
            <input
              type="radio" name={gname} value={v} checked={on}
              onChange={() => select(v)}
              className={styles.input()}
            />
          </label>
        );
      })}
    </div>
  );
}
