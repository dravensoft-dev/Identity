import React from 'react';
import { IconButton } from '../../forms/icon-button/IconButton.tsx';

import type { CatSlot } from '../../../Api.generated';

export interface CalendarEventProps {

  /** Stable identity, so a host can switch on it rather than on the title. */
  id: string;

  /** What the chip reads. */
  title: string;

  /** ISO datetime the event begins. */
  start: string;

  /** ISO datetime the event ends. */
  end: string;

  /** Identity colour. Give the same entity the same slot everywhere and it keeps its colour across views. */
  colorId?: CatSlot;

  /** Whether the chip can be activated. A boolean rather than "is `click` bound?", per R6, and the same member `TableRow.interactive` is for the same reason. An interactive chip is a <button> a keyboard user reaches with Enter from the hour cell it overlaps; a non-interactive one draws the same chip with no role and no activation, so a read-only schedule announces events rather than a screenful of buttons that do nothing. */
  interactive?: boolean;

  /** Whether the chip is drawn but cannot be activated: an event a consumer's rules lock, such as one already past or owned by someone else. It reflects through `aria-disabled` rather than the native `disabled` attribute, so the chip keeps its place in the grid's roving Tab sequence and is announced as unavailable instead of disappearing from it. With `interactive` false there is nothing to activate and the chip is inert already. */
  disabled?: boolean;

  /** Whether the chip shows its action button. A boolean rather than "is the actions slot filled?", per R6: projected content is not inspectable in at least one platform, so gating the drawing on it is a divergence waiting to happen. */
  actionsEnabled?: boolean;

  /** The action panel's content, revealed by the chip's action button. Rendered only while the panel is open, so a consumer's own controls never sit permanently in the grid's Tab sequence. */
  actions?: React.ReactNode;

  /** The chip was activated. No payload: the consumer wrote this element, so they already hold the event this is about. Never emitted while `disabled`. */
  onClick?: () => void;
}


export interface CalendarEventInjected {
  box: React.CSSProperties;
  color: string;
  timeLabel: string;
  dateLabel: string;
  showTime: boolean;
  actionsBelow: boolean;
  tabIndex: number;
  defaultPanelOpen: boolean;
}

const KEBAB_RESERVE = 'calc(var(--dz-ctl-h-sm) + var(--bw) * 2)';

export const CalendarEvent = React.forwardRef<
HTMLElement, CalendarEventProps & Partial<CalendarEventInjected>
>(function CalendarEvent({
  id, title, start, end, colorId, onClick, interactive = false, disabled = false,
  actionsEnabled = false, actions,
  box, color, timeLabel, dateLabel, showTime, actionsBelow, tabIndex, defaultPanelOpen,
}, ref) {

  if (!id) throw new Error('CalendarEvent: `id` is required');
  if (!title) throw new Error('CalendarEvent: `title` is required');
  if (!start) throw new Error('CalendarEvent: `start` is required');
  if (!end) throw new Error('CalendarEvent: `end` is required');

  const hasPanel = actionsEnabled;
  const Tag = interactive && !hasPanel ? 'button' : 'div';

  const [panelOpen, setPanelOpen] = React.useState(Boolean(defaultPanelOpen));

  const bodyIsButton = interactive && hasPanel;

  const activate = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (interactive && !disabled && onClick) onClick();
  };

  const focusableRef = React.useRef<HTMLElement | null>(null);
  const kebabWrapRef = React.useRef<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLElement | null>(null);
  const setFocusable = (node: HTMLElement | null) => {
    focusableRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const kebabEl = (): HTMLElement | null =>
    (kebabWrapRef.current?.firstElementChild instanceof HTMLElement ? kebabWrapRef.current.firstElementChild : null);

  const openedByUser = React.useRef(false);
  React.useEffect(() => {
    if (!panelOpen || !openedByUser.current) return;
    openedByUser.current = false;
    const panel = panelRef.current;
    if (!panel) return;

    const first = panel.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }, [panelOpen]);

  const body = (
    <>
      <span style={{ fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      {showTime && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', color: 'var(--mute)' }}>{timeLabel}</span>
      )}
    </>
  );

  return (
    <Tag ref={bodyIsButton ? undefined : setFocusable}

      type={interactive && !hasPanel ? 'button' : undefined}
      tabIndex={bodyIsButton ? undefined : tabIndex}
      onClick={hasPanel ? undefined : activate}
      aria-label={interactive && !hasPanel ? `${title}, ${dateLabel}, ${timeLabel}` : undefined}
      aria-disabled={interactive && !hasPanel && disabled ? 'true' : undefined}
      onKeyDown={hasPanel ? (e) => {

        if (e.key === 'Escape' && panelOpen) {
          e.stopPropagation();
          setPanelOpen(false);
          const kebab = kebabEl();
          if (kebab) kebab.focus();
          return;
        }
        const kebab = kebabEl();
        if (!kebab) return;
        if (e.key === 'ArrowRight' && e.target !== kebab) {
          e.preventDefault(); e.stopPropagation(); kebab.focus();
        } else if (e.key === 'ArrowLeft' && e.target === kebab && focusableRef.current) {
          e.preventDefault(); e.stopPropagation(); focusableRef.current.focus();
        }
      } : undefined}
      style={{ position: 'absolute', ...box, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 0,

        overflow: panelOpen ? 'visible' : 'hidden',
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
        paddingRight: hasPanel && !actionsBelow ? KEBAB_RESERVE : 'calc(var(--sp-1) * 1.5)',
        background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
        borderLeft: `var(--bw-strong) solid ${color}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 'var(--r-sm)', cursor: interactive ? (disabled ? 'not-allowed' : 'pointer') : 'default',
        opacity: interactive && disabled ? 0.5 : 1,
        font: 'inherit' }}>
      {hasPanel ? (
        <>
          {interactive ? (
            <button type="button" ref={setFocusable} tabIndex={tabIndex}
              onClick={activate}
              aria-label={`${title}, ${dateLabel}, ${timeLabel}`}
              aria-disabled={disabled ? 'true' : undefined}

              style={{ display: 'flex', flexDirection: 'column', gap: 0,
                background: 'none', border: 'none', padding: 0, margin: 0,
                font: 'inherit', color: 'inherit', textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer' }}>
              {body}
            </button>
          ) : (
            <span ref={setFocusable} tabIndex={tabIndex} onClick={activate}
              style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {body}
            </span>
          )}
          <span ref={kebabWrapRef} style={{ position: 'absolute', right: 0, ...(actionsBelow ? { bottom: 0 } : { top: 0 }) }}>
            <IconButton icon="ph-bold ph-dots-three-vertical" label="Actions" size="sm"
              tabStop={false}
              onClick={() => { openedByUser.current = !panelOpen; setPanelOpen((o) => !o); }} />
            {panelOpen && (
              <span ref={panelRef} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1,
                display: 'flex', gap: 'var(--sp-2)', padding: 'var(--sp-2)',
                background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
                borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-2)' }}>
                {actions}
              </span>
            )}
          </span>
        </>
      ) : body}
    </Tag>
  );
});
