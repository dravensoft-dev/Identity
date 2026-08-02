import React from 'react';

import type { TagTone } from '../../../Api.generated';

export interface TagProps {
  /** The tag's label. */
  children?: React.ReactNode;
  /** The tag's emphasis colour. */
  tone?: TagTone;
  /** Whether the dismiss × is shown. Every layer gates the × on this member and never on whether anything listens for `remove`, per R6. Removability is a declared input, not something inferred from the event. */
  removable?: boolean;
  /** Whether removal is unavailable while the tag stays visible: a filter a consumer's permissions lock, not a tag that is merely inert. It reflects through `aria-disabled` rather than the native `disabled` attribute, so the × keeps its place in the tab order and a screen-reader user is told the action is unavailable instead of never finding it. With `removable` false there is no × and nothing to disable. */
  disabled?: boolean;
  /** The dismiss × was activated. Never emitted while `disabled`. */
  onRemove?: () => void;
}


const TONES = {
  neutral: 'color-mix(in oklab, var(--color-base-content) 70%, transparent)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
};
const BORDERS = {
  neutral: 'var(--color-base-300)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
};
export function Tag({ children, tone = 'neutral', removable = false, disabled = false, onRemove }: TagProps) {
  const color = TONES[tone] || TONES.neutral;
  const border = BORDERS[tone] || BORDERS.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5)',
      background: 'var(--panel)', color, border: 'var(--bw) solid ' + border,
      borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)' }}>
      <span aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: 'calc(var(--sp-1) * 1.5)', height: 'calc(var(--sp-1) * 1.5)', borderRadius: '50%', background: 'currentColor' }} />
      {children}
      {removable && <button onClick={disabled ? undefined : onRemove} aria-label="Remove"
        aria-disabled={disabled ? 'true' : undefined}
        style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none',
          color: disabled ? 'var(--mute-2-disabled)' : 'var(--mute)',
          cursor: disabled ? 'not-allowed' : 'pointer', padding: 0, fontSize: 'var(--icon-sm)', lineHeight: 'var(--dz-lh)' }}><i className="ph-bold ph-x" /></button>}
    </span>
  );
}
