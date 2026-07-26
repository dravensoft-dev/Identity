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
  const at = items.findIndex((c) => c.props.value === active);
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
    if (at === -1) return;
    e.preventDefault();
    const next = (at + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
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
          tabId: tabId(i),
          panelId: panelId(i),
          onSelect: select,
        }))}
      </div>
      {/* No active tab means no panel -- never a panel whose aria-labelledby
          points at a tab that does not exist. A dangling label is worse than an
          absent one. */}
      {at !== -1 && (
        <div role="tabpanel" tabIndex={0}
          id={panelId(at)} aria-labelledby={tabId(at)}
          style={{ paddingBlockStart: 'calc(var(--sp-1) * 5.5)' }}>
          {items[at].props.children}
        </div>
      )}
    </>
  );
}
