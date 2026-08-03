import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Radio.classes.generated.ts';

export interface RadioInjected {
  name: string;
  checked: boolean;
  onSelect: (value: string) => void;
}

export interface RadioProps {

  /** This option's value, matched against the group's. */
  value: string;

  /** The option's label. */
  label?: string;

  /** A line of help under the label. */
  hint?: string;

  /** Blocks selection and dims the option. */
  disabled?: boolean;
}


const radioStyles = arenaStyles(manifest);

export function Radio({ value, label, hint, name, checked = false, onSelect, disabled = false }: RadioProps & Partial<RadioInjected>) {
  if (!value) throw new Error('Radio: `value` is required');
  const styles = radioStyles({ checked, disabled });
  return (
    <label className={styles.root()}>
      <span className={styles.ring()}>
        {checked && <span className={styles.dot()} />}
      </span>
      <span className={styles.text()}>
        {label && <span className={styles.label()}>{label}</span>}
        {hint && <span className={styles.hint()}>{hint}</span>}
      </span>
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={() => onSelect && onSelect(value)} className={styles.input()} />
    </label>
  );
}
