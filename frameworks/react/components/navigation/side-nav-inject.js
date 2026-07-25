import React from 'react';

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
