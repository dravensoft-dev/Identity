import React from 'react';

/* THE .jsx EXTENSION IS LOAD-BEARING for a reason that has nothing to do with the
 * one <i> below -- so do not "tidy" it back to .js even after deleting that.
 * `check:dimensions` scans EXTENSIONS = ['.jsx',
 * '.ts', '.tsx'] and deliberately never opens a .js, so `indentFor()` below --
 * which PRODUCES a governed padding-inline-start value -- would sit outside the
 * gate entirely under the other extension. Nothing else would catch it either:
 * the call site is `paddingInlineStart: indentFor(indentStep, depth)`, a call
 * expression, which the gate's dataflow rule explicitly cannot trace back, and
 * no test asserts on the returned string. This file shipped as .js for exactly
 * one commit and `indentFor()` could have returned a bare '12px' with every gate
 * green. Renaming it costs nothing: `bun run build:demos` emits the .js the demo
 * pages load, the same way every component .jsx does. */

/** Clone each child element, handing it where it sits and the values the whole
 *  tree shares.
 *
 *  DIRECT CHILDREN ONLY, one hop. A section or a collapsible re-injects into its
 *  own children with `depth + 1`, and that is what makes nesting arbitrary
 *  without a React context: every level does the same single hop. It is the
 *  Table/TableRow and RadioGroup/Radio idiom repeated, and it carries their limit
 *  rather than escaping it: Arena can only clone elements it is handed, so a
 *  consumer's own wrapper component sitting between two levels breaks the chain --
 *  and so does a FRAGMENT, because `React.Children.toArray` flattens a nested
 *  array and does not flatten a <>...</>. Write items as siblings or in an array,
 *  never wrapped. `toArray` gives every child a key, so cloning never warns, and
 *  drops null/undefined/booleans, so a conditionally-rendered item is absent
 *  rather than counted.
 *
 *  None of what this injects is a member of any contract, exactly as `Radio.json`
 *  declares none of the name/checked/onSelect `RadioGroup` gives it.
 *
 *  @param {React.ReactNode} children
 *  @param {{depth: number, activeId?: string, indentStep: number,
 *           onActivate?: (id: string) => void}} injected
 *  @returns {React.ReactNode[]} */
export function injectInto(children, injected) {
  return React.Children.toArray(children).map((child) => (
    React.isValidElement(child) ? React.cloneElement(child, injected) : child
  ));
}

/** The inline-start padding of a row sitting at `depth`, as a calc() over --sp-1.
 *
 *  A MULTIPLIER, NEVER A LENGTH. A caller-supplied "1.5rem" is neither a token nor
 *  a derivation of one, so it would stop re-densifying inside `.arena-compact` --
 *  and no gate would catch it, because check:dimensions scans source and not the
 *  values a caller passes in. Multiplying a token keeps the whole chain intact.
 *
 *  Depth 0 returns the base padding unchanged rather than `+ 0`, so the common
 *  case emits no arithmetic at all.
 *
 *  @param {number} indentStep @param {number} depth @returns {string} */
export function indentFor(indentStep, depth) {
  const steps = indentStep * depth;
  return steps === 0
    ? 'calc(var(--sp-1) * 3)'
    : `calc(var(--sp-1) * 3 + var(--sp-1) * ${steps})`;
}

/* WHAT FOLLOWS IS SHARED FIGURE, NOT SHARED CONVENIENCE, and it is the
 * TableCell.jsx idiom -- that file exports CELL_BASE and HEADER_LABEL for
 * Table.jsx to import back, because the leaf is what draws a cell. Same here one
 * size down: an ITEM row and a COLLAPSIBLE TRIGGER sit adjacent in one list and
 * must be indistinguishable, and until this extraction they were twelve
 * byte-identical declarations written twice, in files three different agents
 * wrote. Nothing coupled them: check:dimensions judges each site on its own, and
 * the Tailwind manifest duplicates the same string across its `item` and
 * `trigger` slots. Each component still makes its OWN decisions -- the item's
 * active-state ink, the collapsible's constant ink -- and passes them in.
 *
 * These stay inside a .jsx file so the gate keeps seeing them: every value below
 * sits at a governed property SITE in a scanned file, so a bare '12px' written
 * here fails check:dimensions exactly as it would at the call site. That is not
 * true of `indentFor`'s RETURN value, which is why SideNav.test.jsx asserts on
 * it directly; nothing about this extraction moved geometry out from under the
 * gate. */

/** The vertical stack every level of the nav lays out in -- the root <nav>, a
 *  section's group and a collapsible's region and wrapper. Four sites, one
 *  figure. A caller that must vary the display (the region, which collapses)
 *  spreads this and overrides that one key; the spread keeps `display` in its
 *  original position, so the serialized declaration order does not move. */
export const COLUMN = { display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' };

/** The geometry of ONE ROW of the nav, at `depth`, with its ink handed in.
 *
 *  `background`, `color`, `fontWeight` and `textDecoration` are PARAMETERS rather
 *  than values because they are the two components' own decisions: the item reads
 *  them off its active state, the trigger holds them constant. They are taken in
 *  rather than merged over afterwards so the returned object keeps ONE key order,
 *  the order both components already rendered -- a spread would move ink after
 *  type and rewrite every style attribute in the layer for no reason.
 *  `textDecoration` is undefined for the trigger, which React omits: a <button>
 *  never had the declaration and still does not.
 *
 *  @param {{indentStep: number, depth: number, background: string, color: string,
 *           fontWeight: string, textDecoration?: string}} ink */
export function rowStyle({ indentStep, depth, background, color, fontWeight, textDecoration }) {
  return {
    display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
    paddingBlock: 'calc(var(--sp-1) * 2.5)',
    paddingInlineEnd: 'calc(var(--sp-1) * 3)',
    paddingInlineStart: indentFor(indentStep, depth),
    borderRadius: 'var(--r-sm)',
    background, color,
    border: 'none', cursor: 'pointer', textAlign: 'left', textDecoration,
    fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)',
    fontWeight,
  };
}

/** The glyph a row draws before its label, or nothing when no icon was named.
 *
 *  The single-icon convention: Arena draws the <i>, the consumer names the class.
 *  A collapsible's CARET is not this -- it is Arena's own, it reports state rather
 *  than identity, and it is drawn at --icon-md beside the label's end.
 *
 *  @param {string} [icon] @returns {React.ReactElement|null} */
export function rowGlyph(icon) {
  return icon
    ? <i className={icon} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
    : null;
}
