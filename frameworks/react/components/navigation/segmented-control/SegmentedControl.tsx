import React, { useState } from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './SegmentedControl.classes.generated.ts';

import type { ArenaSegmentOption, ArenaSegmentedControlSize } from '../../../Api.generated';

export type { ArenaSegmentOption };
export interface SegmentedControlProps {

  /** The options, in order. Two to four with one-word labels. */
  options: readonly ArenaSegmentOption[];

  /** The selected option's value. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;

  /** The initially selected value when uncontrolled. Defaults to the first option. */
  defaultValue?: string;

  /** Compact or default. */
  size?: ArenaSegmentedControlSize;

  /** Names what is being filtered: "Time range", not "Filter". A radio group with no accessible name is announced unlabelled. */
  ariaLabel: string;

  /** Shared name for the underlying radios; generated when omitted. */
  name?: string;

  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}


const segmentedStyles = arenaStyles(manifest);

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
