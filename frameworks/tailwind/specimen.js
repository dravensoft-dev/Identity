/* The shared harness behind every *.card.html specimen in this folder.
 *
 * A specimen exists to answer one question by eye: does this manifest, applied
 * to this component's real markup, render the component Arena's README
 * specifies? So the harness supplies only what that needs — labelled rows, the
 * page chrome the React card pages already use, and nothing that could style
 * the component itself. Every class on a specimen's own elements comes from
 * classesFor(); a class typed into the page instead would be styling the
 * manifest does not carry, which is the one thing a specimen must never show.
 */
import { classesFor } from './manifest-classes.js';

/** @param {string} tag @param {object} [props] `class`, `text`, and any attribute
 *  @param {...(Node|string)} children @returns {HTMLElement} */
export function el(tag, props = {}, ...children) {
  const node = tag === 'svg' || tag === 'path' || tag === 'circle'
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.setAttribute('class', v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) node.append(child);
  return node;
}

/** @param {string} label @param {(Node|string)[]} nodes
 *  @param {{stack?: boolean, align?: 'stretch'|'start', justify?: 'center', gap?: 'loose'}} [opts]
 *    Each is a named escape hatch from the shared row's default (wrapped,
 *    centred cross-axis, default gap) for when that default would hide or
 *    distort the point a section is making. Reach for one only when it does:
 *    - `stack`: lay the examples out in a column instead of a row, for a
 *      component that occupies a full row on its own (Alert, Table, a Dialog
 *      panel) — a row would otherwise flow it into one column anyway.
 *    - `align: 'stretch'`: equalize cross-axis height across the row's
 *      examples, for a set the component itself renders at a uniform height
 *      (StatCard's tiles). The default `center` floats the shorter ones at
 *      their own height instead, which reads as the component failing to
 *      tile evenly when it is the specimen, not the component, doing that.
 *    - `align: 'start'`: top-align instead of centring, for comparing two
 *      examples of deliberately different height (a headed vs. a bare
 *      ChartCard tile). Centring shifts the shorter one down and the two
 *      slots go out of alignment, so the comparison reads as an accidental
 *      offset instead of the deliberate omission it demonstrates.
 *    - `justify: 'center'`: centre the row's content on the main axis, for a
 *      section holding one full-frame example (UnauthCard's signed-out
 *      panel) whose real presentational context centres it. The default
 *      packs content flush left, which is only ever right for a row of
 *      independent, left-reading examples.
 *    - `gap: 'loose'`: widen the gap beyond the default, for examples small
 *      or visually similar enough (AppLogo's lock-ups) that the default gap
 *      reads as one continuous shape rather than separate instances.
 *  @returns {{label: string, nodes: (Node|string)[], stack: boolean, align?: 'stretch'|'start', justify?: 'center', gap?: 'loose'}} */
export function section(label, nodes, opts = {}) {
  return {
    label,
    nodes,
    stack: Boolean(opts.stack),
    align: opts.align,
    justify: opts.justify,
    gap: opts.gap,
  };
}

/** Renders the sections into `mount`, each under its micro-label.
 *  @param {{sections: {label: string, nodes: (Node|string)[], stack?: boolean, align?: 'stretch'|'start', justify?: 'center', gap?: 'loose'}[], mount?: Element}} opts */
export function mountSpecimen({ sections, mount = document.getElementById('root') }) {
  for (const { label, nodes, stack, align, justify, gap } of sections) {
    mount.append(el('div', { class: 'sub', text: label }));
    const classes = ['row'];
    if (stack) classes.push('stack');
    if (align) classes.push(`align-${align}`);
    if (justify) classes.push(`justify-${justify}`);
    if (gap) classes.push(`gap-${gap}`);
    const row = el('div', { class: classes.join(' ') });
    for (const node of nodes) row.append(node);
    mount.append(row);
  }
}

export { classesFor };
