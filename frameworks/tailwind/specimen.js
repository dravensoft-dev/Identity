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
 *  @param {{stack?: boolean}} [opts] stack: lay the examples out in a column,
 *    for components that occupy a full row on their own
 *  @returns {{label: string, nodes: (Node|string)[], stack: boolean}} */
export function section(label, nodes, opts = {}) {
  return { label, nodes, stack: Boolean(opts.stack) };
}

/** Renders the sections into `mount`, each under its micro-label.
 *  @param {{sections: {label: string, nodes: (Node|string)[]}[], mount?: Element}} opts */
export function mountSpecimen({ sections, mount = document.getElementById('root') }) {
  for (const { label, nodes, stack } of sections) {
    mount.append(el('div', { class: 'sub', text: label }));
    const row = el('div', { class: stack ? 'row stack' : 'row' });
    for (const node of nodes) row.append(node);
    mount.append(row);
  }
}

export { classesFor };
