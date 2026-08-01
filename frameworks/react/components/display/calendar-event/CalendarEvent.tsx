import React from 'react';
import { IconButton } from '../../forms/icon-button/IconButton.tsx';

import type { CatSlot } from '../../../Api.generated';

export interface CalendarEventProps {

  id: string;

  title: string;

  start: string;

  end: string;

  colorId?: CatSlot;

  interactive?: boolean;

  disabled?: boolean;

  actionsEnabled?: boolean;

  actions?: React.ReactNode;

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
