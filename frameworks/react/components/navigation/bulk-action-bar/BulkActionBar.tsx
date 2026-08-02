import React, { useRef, useState } from 'react';

import type { BulkAction } from '../../../Api.generated';

export type { BulkAction };

export interface BulkActionBarProps {

  /** How many rows are selected. Zero renders no bar at all. */
  count: number;

  /** What is being counted, plural: "items", "projects". */
  noun?: string;

  /** The actions offered for the current selection. */
  actions: BulkAction[];

  /** An action was activated, carrying which one. */
  onRun?: (action: BulkAction) => void;

  /** Whether the Clear control is drawn. Every layer gates on this member and never on whether anything listens for `clear`, per R6. */
  clearable?: boolean;

  /** The Clear control was activated. */
  onClear?: () => void;
}


export function BulkActionBar({ count, noun = 'items', actions, onRun, onClear, clearable = true }: BulkActionBarProps) {
  if (count == null) throw new Error('BulkActionBar: `count` is required');
  if (actions == null) throw new Error('BulkActionBar: `actions` is required');
  if (!count) return null;

  const barRef = useRef<HTMLDivElement | null>(null);
  const [cursor, setCursor] = useState(0);
  const stops = clearable ? actions.length + 1 : actions.length;
  const at = Math.min(cursor, Math.max(stops - 1, 0));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const bar = barRef.current;
    if (!bar) return;
    const els = [...bar.querySelectorAll('button')];
    if (els.length === 0) return;
    const active = document.activeElement;
    const here = active instanceof HTMLButtonElement ? els.indexOf(active) : -1;
    const from = here === -1 ? at : here;
    const there = e.key === 'ArrowRight'
      ? (from + 1) % els.length
      : (from - 1 + els.length) % els.length;
    e.preventDefault();
    setCursor(there);
    els[there]?.focus();
  };

  return (
    <div role="toolbar" aria-label="Actions on the selection"
      ref={barRef} onKeyDown={onKeyDown}
      style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3.5)', minHeight: 'calc(var(--sp-1) * 13)', padding: '0 calc(var(--sp-1) * 3) 0 calc(var(--sp-1) * 4)',
        background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)', borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-2)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-mono-nav)', color: 'var(--bone)' }}>
        <b style={{ color: 'var(--gold)' }}>{count}</b> {noun} selected
      </span>
      <span aria-hidden="true" style={{ width: 'var(--bw)', height: 'calc(var(--sp-1) * 5.5)', background: 'var(--color-base-300)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', flex: 1, flexWrap: 'wrap' }}>
        {actions.map((a, i) => (
          <button key={i} onClick={() => onRun && onRun(a)}
            tabIndex={i === at ? 0 : -1} onFocus={() => setCursor(i)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3)',
              background: 'transparent',
              border: 'var(--bw) solid ' + (a.destructive ? 'var(--danger)' : 'var(--color-base-300)'),
              borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text-md)',
              color: a.destructive ? 'var(--danger)' : 'var(--bone-dim)',
              transition: 'background var(--dur-fast) var(--ease-out)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = a.destructive ? 'var(--danger-soft)' : 'var(--panel)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            {a.icon && <span style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }}><i className={a.icon} aria-hidden="true" /></span>}{a.label}
          </button>
        ))}
      </div>
      {clearable && (
        <button onClick={() => onClear && onClear()} aria-label="Clear selection"
          tabIndex={actions.length === at ? 0 : -1} onFocus={() => setCursor(actions.length)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-badge)', textTransform: 'uppercase' }}>
          Clear
        </button>
      )}
    </div>
  );
}
