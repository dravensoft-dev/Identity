import React, { useId } from 'react';

import type { SheetPlacement } from '../../../Api.generated';

export interface SheetProps {

  /** Whether the panel is on the page at all. The host owns it, the same way it owns a dialog's. Closed renders nothing, which is what distinguishes it from collapsed. */
  open: boolean;

  /** The edge the panel is anchored to. It spans that edge and stands off the device's own inset there, so a bottom sheet on a phone clears the home indicator. */
  placement?: SheetPlacement;

  /** Names the panel for assistive technology and heads it visually. It is also the accessible name of the fold control, so a reader hears which panel is being folded rather than the word Toggle. Required and **guarded at runtime** rather than defaulted: what this panel is showing is editorial, and a constant fallback would satisfy the pattern mechanically while telling a screen-reader user nothing. */
  title: string;

  /** Whether the body is folded away. The header stays visible either way: a collapsed panel is still on the page and still says what it is, which is why folding is not the same act as closing. The body is hidden rather than removed, so the fold control's reference to it never points at nothing. */
  collapsed?: boolean;

  /** The fold control was pressed, carrying the state it moved to. Arena never folds the panel by itself, so a host that ignores this gets a control that reports and a body that does not move. */
  onCollapsedChange?: (collapsed: boolean) => void;

  /** Whether the close control is shown. Every layer gates it on this member and never on whether anything listens for `close`, per R6. */
  dismissible?: boolean;

  /** The panel was dismissed, by the close control or by Escape. No payload. Escape reports here rather than adding a member of its own, and it is the only key the panel takes: a non-modal panel leaves every other key to the page behind it. */
  onClose?: () => void;

  /** The panel's body, which is what folds away. */
  children?: React.ReactNode;

  /** A row that stays put while the body scrolls: a total and its action, a pair of filters buttons. It is outside the folding body on purpose, so a folded panel can still carry the one action it exists for. */
  footer?: React.ReactNode;
}

const ANCHORED: Record<SheetPlacement, React.CSSProperties> = {
  bottom: {
    insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, maxHeight: '80vh',
    borderStartStartRadius: 'var(--r-lg)', borderStartEndRadius: 'var(--r-lg)',
    paddingBottom: 'var(--pad-safe-bottom)',
  },
  start: {
    top: 0, bottom: 0, insetInlineStart: 0, width: 'calc(var(--sp-1) * 120)', maxWidth: '92vw',
    borderStartEndRadius: 'var(--r-lg)', borderEndEndRadius: 'var(--r-lg)',
    paddingTop: 'var(--pad-safe-top)', paddingBottom: 'var(--pad-safe-bottom)',
  },
  end: {
    top: 0, bottom: 0, insetInlineEnd: 0, width: 'calc(var(--sp-1) * 120)', maxWidth: '92vw',
    borderStartStartRadius: 'var(--r-lg)', borderEndStartRadius: 'var(--r-lg)',
    paddingTop: 'var(--pad-safe-top)', paddingBottom: 'var(--pad-safe-bottom)',
  },
};

const HEAD: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
  padding: 'var(--sp-4) var(--sp-5)', borderBottom: 'var(--bw) solid var(--color-base-300)',
};

const TRIGGER: React.CSSProperties = {
  display: 'flex', flex: 1, alignItems: 'center', gap: 'var(--sp-2)', padding: 0,
  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
  fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)',
  color: 'var(--bone)', letterSpacing: 'var(--ls-tight)',
};

export function Sheet({
  open, placement = 'bottom', title, collapsed = false, onCollapsedChange,
  dismissible = false, onClose, children, footer,
}: SheetProps) {

  if (!title || title.trim() === '') throw new Error('Sheet: `title` is required, and names the panel and the control that folds it');

  if (open == null) throw new Error('Sheet: `open` is required');

  const id = useId();
  const triggerId = `${id}-trigger`;
  const bodyId = `${id}-body`;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onClose?.();
  };

  if (!open) return null;
  return (
    <div onKeyDown={onKeyDown}
      style={{ position: 'fixed', zIndex: 'var(--z-sheet)', display: 'flex', flexDirection: 'column',
        background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)',
        boxShadow: 'var(--shadow-3)', overflow: 'hidden', ...ANCHORED[placement] }}>
      <div style={HEAD}>
        <button type="button" id={triggerId} aria-expanded={!collapsed} aria-controls={bodyId}
          onClick={() => onCollapsedChange?.(!collapsed)} style={TRIGGER}>
          <span>{title}</span>
          <i className={collapsed ? 'ph-bold ph-caret-up' : 'ph-bold ph-caret-down'} aria-hidden="true"
            style={{ flexShrink: 0, fontSize: 'var(--icon-md)', lineHeight: 'var(--dz-lh)', color: 'var(--mute)' }} />
        </button>
        {dismissible && (
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, background: 'none', border: 'none',
              color: 'var(--mute)', cursor: 'pointer', fontSize: 'var(--icon-md)', lineHeight: 'var(--dz-lh)' }}>
            <i className="ph-bold ph-x" aria-hidden="true" />
          </button>
        )}
      </div>
      <div id={bodyId} role="group" aria-labelledby={triggerId} hidden={collapsed}
        style={{ display: collapsed ? 'none' : 'block', flex: 1, overflowY: 'auto', padding: 'var(--sp-4) var(--sp-5)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)', color: 'var(--bone-dim)' }}>
        {children}
      </div>
      {footer && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 'calc(var(--sp-1) * 2.5)',
          padding: 'var(--sp-4) var(--sp-5)', borderTop: 'var(--bw) solid var(--color-base-300)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
