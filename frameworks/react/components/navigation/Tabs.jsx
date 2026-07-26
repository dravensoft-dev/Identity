import React, { useId, useRef, useState } from 'react';

/** A row of tabs and the one panel they switch between.
 *
 *  COMPOUND, like RadioGroup/Radio and Table/TableRow before it: the consumer
 *  writes one `<Tab>` per view, and this component owns WHERE each goes -- the
 *  strip, the selection, the roving tab stop, the arrow keys -- while the tab
 *  owns what it reads. Injection is `cloneElement` over DIRECT CHILDREN, one hop,
 *  with no React context. It carries the family's limit rather than escaping it:
 *  a consumer's own wrapper component between this and its tabs breaks the chain,
 *  and so does a FRAGMENT, because React.Children.toArray flattens a nested array
 *  and does not flatten a <>...</>.
 *
 *  The panel is rendered HERE rather than by the tab, and that is markup rather
 *  than preference: a tabpanel may not sit inside a tablist, so the item cannot
 *  draw its own and still be a sibling of the strip. */
export function Tabs({ children, value, defaultValue, onChange }) {
  /* useId() returns a value containing COLONS (`:r0:`). That is legal in an id
   * attribute and in an IDREF, and it is a SyntaxError inside a CSS selector --
   * so an id built straight from it would be unaddressable by our own suites and
   * by a consumer. Stripping them keeps uniqueness (`:r0:` and `:r1:` differ
   * after the strip) and costs one line. Never Math.random(), which differs
   * between the server pass and the client one. */
  const base = `tabs-${useId().replace(/:/g, '')}`;
  /* toArray().length, never Children.count(): count() counts a bare `false` as one
   * child, which the conditional-render idiom {cond && <Tab/>} writes when the
   * condition is false -- and this component would then believe it has a tab it
   * will never render, and select it. */
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const [internal, setInternal] = useState(defaultValue ?? (items[0] && items[0].props.value));
  const active = value ?? internal;
  /* SELECTION and the ROVING TAB STOP are two different things, and conflating
   * them made the widget keyboard-dead. `at` is the selection and may be -1: a
   * controlled `value` naming no child (a stale route param, an async swap) and
   * the uncontrolled case where the tabs arrive AFTER mount -- useState's
   * initialiser latched `undefined` on a first render that had no children --
   * both reach it. Nothing may invent a selection there: a controlled component
   * may not select what the consumer did not ask for, and a panel may not appear
   * for a tab that is not active.
   *
   * `stop` is the other concept and is never -1. Exactly one tab must stay in the
   * page's tab sequence whatever the selection is, or there is no way in at all
   * -- deriving tabIndex from `selected` alone put EVERY tab at -1 in both cases
   * above. It is also the origin the arrow keys move from, so the strip stays
   * operable from the one tab a user can reach. */
  const at = items.findIndex((c) => c.props.value === active);
  const stop = at === -1 ? 0 : at;
  const listRef = useRef(null);
  const select = (v) => { setInternal(v); onChange && onChange(v); };
  /* The ids are keyed by INDEX rather than by `value`, because a value is the
   * consumer's string and nothing constrains it to be usable inside an id. An
   * index is unique, stable across a render, and needs no escaping. */
  const tabId = (i) => `${base}-tab-${i}`;
  const panelId = (i) => `${base}-panel-${i}`;

  /* Automatic activation: an arrow moves focus AND selects, which is what APG
   * recommends when the panel displays instantly. Focus is moved by querying the
   * tablist for its buttons rather than by holding a ref per tab: cloneElement
   * cannot inject a `ref` into a plain function component, and making Tab a
   * forwardRef to satisfy a test would be the tail wagging the dog. */
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    /* The empty strip is the only case with nowhere to move -- and it is a guard
       against `% 0`, not a stance. An unmatched selection moves from `stop`. */
    if (items.length === 0) return;
    e.preventDefault();
    const next = (stop + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    select(items[next].props.value);
    const buttons = listRef.current ? listRef.current.querySelectorAll('[role="tab"]') : [];
    if (buttons[next]) buttons[next].focus();
  };

  return (
    <>
      <div role="tablist" ref={listRef} onKeyDown={onKeyDown}
        style={{
          display: 'flex', gap: 'calc(var(--sp-1) * 1)',
          borderBottom: 'var(--bw) solid var(--color-base-300)',
        }}>
        {items.map((child, i) => React.cloneElement(child, {
          selected: i === at,
          /* Passed rather than inferred from `selected`, because the two differ
             the moment nothing is selected -- which is the whole fix. */
          tabStop: i === stop,
          tabId: tabId(i),
          panelId: panelId(i),
          onSelect: select,
        }))}
      </div>
      {/* ONE PANEL PER TAB, the inactive ones hidden rather than absent, because
          the pattern requires EACH tab to have an aria-controls referencing its
          tabpanel -- and a reference to an id nothing renders is not a reference.
          Rendering only the selected tab's panel emitted the exact mirror of the
          dangling aria-labelledby this component already refuses.

          `hidden` AND display, never one of them -- the rule SideNavCollapsible's
          region states: an inline display beats [hidden]'s UA display:none, so
          the two must agree or a consumer stylesheet can pull a hidden panel back
          into view.

          The hidden panels leave the tab sequence explicitly rather than only by
          `hidden`, so the widget carries one tab stop in the strip and one in the
          panel region whatever a stylesheet does to the rest.

          THE PRICE, and it is a real behaviour change: every tab's children now
          MOUNT, so a panel's side effects run immediately rather than on first
          selection. Tabs.prompt.md and the contract both say so. */}
      {items.map((child, i) => (
        /* keyed by the child's OWN key, never `i` -- the tablist's clone above
           keeps that same key, and toArray() preserves each survivor's ORIGINAL
           slot when an earlier one drops out (a .map() losing an element, or a
           {cond && <Tab/>} flipping): the child's key stays put, an index into
           the filtered array shifts. A shifted `i` made React reuse the wrong
           subtree, and reused DOM state does not care whose panel it was. */
        <div key={child.key} role="tabpanel" tabIndex={i === at ? 0 : -1}
          id={panelId(i)} aria-labelledby={tabId(i)} hidden={i !== at}
          style={{ paddingBlockStart: 'calc(var(--sp-1) * 5.5)', display: i === at ? 'block' : 'none' }}>
          {child.props.children}
        </div>
      ))}
    </>
  );
}
