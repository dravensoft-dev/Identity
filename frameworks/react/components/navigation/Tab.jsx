import React, { useState } from 'react';

/** One tab in a `Tabs` strip, and the panel it shows. `Tab` draws the BUTTON;
 *  its `children` are the panel's content, which `Tabs` places in the tabpanel it
 *  renders for this tab beside the tablist -- one per tab, all but the selected
 *  one hidden. That split is forced by the markup: a tabpanel may not sit inside
 *  a tablist, so the item cannot render its own.
 *
 *  Everything about WHERE the tab sits -- whether it is selected, the ids that
 *  wire it to its panel, and the handler that reports the choice -- is injected
 *  by `Tabs` and is deliberately absent from this component's contract, exactly
 *  as `RadioProps` omits what `RadioGroup` gives each `Radio`. */
export function Tab({
  value, label,
  selected = false, tabStop = false, tabId, panelId, onSelect,
}) {
  /* Falsy rather than absence-only, the operator decision every guard in the
   * navigation group carries: `label` is this tab's whole accessible name and
   * `value` is what the selection is keyed off, so a present-but-blank value IS
   * the defect and `== null` would let it through. */
  if (!value) throw new Error('Tab: `value` is required');
  if (!label) throw new Error('Tab: `label` is required');
  const [focus, setFocus] = useState(false);
  return (
    <button type="button" role="tab" id={tabId}
      aria-selected={selected} aria-controls={panelId}
      /* focus.roving: exactly one tab is the strip's tab stop; the rest are
         reachable by ArrowLeft/ArrowRight, which Tabs owns. WHICH one is Tabs'
         decision and is injected, not derived from `selected` here: the two
         differ whenever the active value names no tab, and deriving it left
         every tab at -1 -- a widget with no keyboard route into it at all. */
      tabIndex={tabStop ? 0 : -1}
      onClick={() => onSelect && onSelect(value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        position: 'relative',
        padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 4)',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: selected ? 'var(--fw-semibold)' : 'var(--fw-medium)',
        fontSize: 'var(--dz-text)',
        color: selected ? 'var(--bone)' : 'var(--mute)',
        /* Written as a nested ternary rather than composed from two named
           consts, and that is deliberate: check:dimensions judges every leaf of
           a ternary AT a governed property site, and cannot see a string built
           by a join() or traced through a call. A tidier composition here would
           put the focus ring outside the gate. */
        boxShadow: selected
          ? (focus
            ? '0 0 0 var(--focus-width) var(--gold-soft), inset 0 calc(var(--bw-strong) * -1) 0 var(--crimson)'
            : 'inset 0 calc(var(--bw-strong) * -1) 0 var(--crimson)')
          : (focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none'),
        transition: 'color var(--dur-fast) var(--ease-out)',
      }}>
      {label}
    </button>
  );
}
