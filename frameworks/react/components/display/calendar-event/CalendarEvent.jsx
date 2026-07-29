import React from 'react';
import { IconButton } from '../../forms/icon-button/IconButton.jsx';

/** One event on a `Calendar`'s schedule. Write one per event as a child of
 * `Calendar`; it never stands alone, because everything about WHERE it goes is
 * the calendar's to decide.
 *
 * THE DIVISION OF LABOUR, because it is the whole reason this is a component and
 * not a field of a declared object: `Calendar` owns where an event goes — the
 * placement, the column it shares with its overlaps, the grid, the keyboard.
 * `CalendarEvent` owns what an event LOOKS like — the chip chrome, the title,
 * the time line. Neither reaches into the other.
 *
 * `box`, `color`, `timeLabel`, `dateLabel`, `showTime`, `tabIndex` and the
 * forwarded `ref` are INJECTED by `Calendar` through `cloneElement` and are not
 * part of this component's public API — the same shape, and for the same reason,
 * as `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`. A
 * consumer never writes one of them.
 *
 * The ref is forwarded because `Calendar` keeps a map of event id -> the
 * rendered chip, which is how Enter steps into an event from the hour cell that
 * intersects it and Escape steps back out. A chip that swallowed its ref would
 * take that route away silently. */
export const CalendarEvent = React.forwardRef(function CalendarEvent({
  id, title, start, end, colorId, onClick, actionsEnabled = false, actions,
  box, color, timeLabel, dateLabel, showTime, tabIndex, defaultPanelOpen,
}, ref) {
  /* Required-ness governs runtime, not only the declaration (contracts/api/README.md).
     Inside a Calendar an event with an unreadable start/end is dropped with a
     console warning by placeEvents before it ever renders; these guards are what
     a chip written by hand, or built from a half-filled record, hits instead. */
  if (!id) throw new Error('CalendarEvent: `id` is required');
  if (!title) throw new Error('CalendarEvent: `title` is required');
  if (!start) throw new Error('CalendarEvent: `start` is required');
  if (!end) throw new Error('CalendarEvent: `end` is required');

  /* A kebab inside the chip means the chip itself cannot be the <button>:
     nesting one button in another is invalid HTML and the browser restructures
     it silently. With actions, the chip is a <div> and the BODY becomes the
     button; without them, nothing about the markup changes at all, so every
     chip in the tree today renders byte-identically.

     THE MEMBER ALONE DECIDES, and `Boolean(actions)` is deliberately not part
     of it. The contract's own description of `actionsEnabled` says why: it is a
     boolean rather than "is the actions slot filled?" because Angular cannot
     detect whether an <ng-content> was filled, so a React that drew the kebab
     only when the slot happened to be filled would be a divergence the member
     exists to make impossible. `actionsEnabled` with an empty slot draws a
     kebab over an empty panel in both layers, which is a consumer mistake both
     layers make visible in the same way. */
  const hasPanel = actionsEnabled;
  const Tag = onClick && !hasPanel ? 'button' : 'div';

  /* `defaultPanelOpen` is a TEST SEAM and deliberately not a contract member:
     renderToStaticMarkup cannot click, and the alternative was leaving the open
     branch unasserted entirely. It is not in CalendarEvent.d.ts and not in the
     contract, so check:api never sees it -- the same status as the props
     Calendar injects. */
  const [panelOpen, setPanelOpen] = React.useState(Boolean(defaultPanelOpen));

  /* THE REF FOLLOWS THE FOCUSABLE ELEMENT, and getting this wrong is invisible
     to every test in the tree. `Calendar` keeps ev.id -> this ref and calls
     node.focus() on it when Enter steps in from an hour cell; a <div> with no
     tabindex is not focusable, so pointing the ref at the chip root of a
     paneled chip made Enter a silent no-op in a real browser -- and happy-dom's
     focus() focuses anything, so a render suite would not have caught it
     either. Whichever element carries `tabIndex` is the element the ref goes
     on: the body button when there is a panel, the chip root otherwise. */
  const bodyIsButton = Boolean(onClick) && hasPanel;

  /* THE KEYBOARD ROUTE TO THE KEBAB, and why it is arrows rather than Tab.
     Tab must LEAVE a composite -- that is what makes a grid one tab stop, and
     `focus.roving` is the requirement Calendar would break by making the kebab
     tabbable. Arrows are the grid's own vocabulary, and inside a chip they are
     free: Calendar's onGridKeyDown only acts when the event target carries
     role="gridcell", and a chip is not one. So ArrowRight steps from the chip
     to its kebab and ArrowLeft steps back, the same shape APG gives a composite
     whose cell holds more than one widget.

     `focusableRef` is merged with the forwarded one rather than replacing it:
     Calendar owns that ref (it is how Enter steps in from an hour cell), and
     the arrows need to read the same node to step back to it. A ref can arrive
     as a callback or as an object, so both are handled. */
  const focusableRef = React.useRef(null);
  const kebabWrapRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const setFocusable = (node) => {
    focusableRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };
  /* The kebab is an Arena IconButton, which is a plain function component with
     no forwardRef, so its <button> is reached through the wrapper it already
     had rather than by widening IconButton's API for one caller. It is that
     wrapper's first element child by construction -- the panel renders after
     it. */
  const kebabEl = () => kebabWrapRef.current && kebabWrapRef.current.firstElementChild;

  /* Opened BY THE USER, not on mount: `defaultPanelOpen` starts a chip open in
     tests, and focusing on mount would steal focus from whatever the page was
     doing. The flag is set by the toggle and consumed once. */
  const openedByUser = React.useRef(false);
  React.useEffect(() => {
    if (!panelOpen || !openedByUser.current) return;
    openedByUser.current = false;
    const panel = panelRef.current;
    if (!panel) return;
    /* Focus lands INSIDE the panel on open, which Arena's own Menu does not do
       and which CLAUDE.md records as a defect of Menu rather than a convention
       to copy. Without it a keyboard user opens a panel and is left standing on
       the button that opened it, with no way in but Tab -- and Tab leaves the
       grid. */
    const first = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }, [panelOpen]);

  /* The chip's own body, hoisted so the branch below can place it in two
     different parents without duplicating it. */
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
      /* Without a kebab the chip IS the button and nothing about this element
         changes. With one AND an onClick, every interactive attribute moves
         down to the body and the chip becomes an inert positioned box. With one
         and no onClick there is no body button to move them to, so the root
         keeps `tabIndex` and stays the programmatically focusable element --
         which is what Escape out of the chip needs. */
      type={onClick && !hasPanel ? 'button' : undefined}
      tabIndex={bodyIsButton ? undefined : tabIndex}
      onClick={onClick && !hasPanel ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      aria-label={onClick && !hasPanel ? `${title}, ${dateLabel}, ${timeLabel}` : undefined}
      onKeyDown={hasPanel ? (e) => {
        /* Closing takes priority over leaving. Without this, Escape inside an
           open panel would jump focus back to the hour cell AND leave the panel
           open behind it, which is the shape of bug that only ever shows up in
           a screen-reader session. stopPropagation is what keeps Calendar's own
           Escape handler from seeing it.

           Focus comes back to the kebab on close, and it has to: by then focus
           is usually on a control INSIDE the panel, and React is about to
           unmount it. A focused element that disappears drops focus to <body>,
           which is out of the grid entirely -- the user would be thrown to the
           top of the page by pressing Escape. */
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
      style={{ position: 'absolute', ...box,
        display: 'flex', flexDirection: 'column', gap: 0,
        /* The clip is what ate the open panel: the chip is the containing block
           for both the kebab and the panel, and a panel is taller than any chip
           under about 110 minutes -- measured, on a 30-minute chip the Delete
           button's centre returned the background. So it is lifted while the
           panel is OPEN, which leaves every other chip, panelled or not,
           rendering exactly as before.

           A CORRECTION, because the first version of this comment and the commit
           that carried it both said the wrong thing: the title's own
           nowrap/hidden/ellipsis does NOT survive the clip being lifted on its
           own. It only survives because the body button below no longer sets
           `align-items: flex-start`. Under flex-start the span is sized to its
           content, and with nowrap its min-content width IS the full text width,
           so its own overflow never engages and the chip's clip was doing the
           whole job -- measured at 56px of title spilling into the neighbouring
           day column the moment the panel opened. Stretch is what makes the span
           narrower than its text, and therefore what makes the ellipsis real. */
        overflow: panelOpen ? 'visible' : 'hidden',
        textAlign: 'left', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 1.5)',
        background: `color-mix(in oklab, ${color} 16%, var(--surface-card))`,
        borderLeft: `var(--bw-strong) solid ${color}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 'var(--r-sm)', cursor: onClick ? 'pointer' : 'default',
        font: 'inherit' }}>
      {hasPanel ? (
        <>
          {onClick ? (
            <button type="button" ref={setFocusable} tabIndex={tabIndex}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              aria-label={`${title}, ${dateLabel}, ${timeLabel}`}
              /* No `align-items` here, so it stays `stretch` and the title span
                 is as wide as this button rather than as wide as its own text.
                 That is what lets the span's own text-overflow ellipsis engage,
                 which the chip's clip was silently doing for it before -- and it
                 also fixes the older defect that a title in a panelled chip was
                 hard-cut rather than ellipsised, clip or no clip. */
              style={{ display: 'flex', flexDirection: 'column', gap: 0,
                background: 'none', border: 'none', padding: 0, margin: 0,
                font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
              {body}
            </button>
          ) : body}
          <span ref={kebabWrapRef} style={{ position: 'absolute', top: 0, right: 0 }}>
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
