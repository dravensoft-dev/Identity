/* node:assert renders both operands into its diff when an equality assertion fails, and a
 * happy-dom node that is CONNECTED reaches the whole shared document from there -- so the
 * cost is set by the tree the node hangs in, not by what it is compared against, and it is
 * what exhausts the run rather than what reports the defect. These compare identity and
 * render the operands themselves, so a failure names the node and stays one line.
 * Measured on a THREE-element body, as AssertionError message length: two detached buttons
 * 1,441; two connected 12,755; a connected button against null 285,795; document.body against
 * a connected button 518,563. Comparing against null is not the safe case. */

import assert from 'node:assert/strict';

export function describeNode(node: unknown): string {
  if (node === null) return 'null';
  if (node === undefined) return 'undefined';
  const element = node as Partial<Element>;
  if (typeof element.tagName !== 'string') return `a ${typeof node}, not an element`;
  const id = element.id ? `#${element.id}` : '';
  const role = element.getAttribute?.('role');
  const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `<${element.tagName.toLowerCase()}${id}${role ? ` role="${role}"` : ''}>${text}`;
}

export function assertSameNode(actual: unknown, expected: unknown, message?: string): void {
  if (actual === expected) return;
  assert.fail(`${message ?? 'the node is not the expected one'}`
    + `\n  expected: ${describeNode(expected)}`
    + `\n  actual:   ${describeNode(actual)}`);
}

export function assertNotSameNode(actual: unknown, expected: unknown, message?: string): void {
  if (actual !== expected) return;
  assert.fail(`${message ?? 'the two nodes are the same one'}\n  both are: ${describeNode(actual)}`);
}

export function assertNoNode(actual: unknown, message?: string): void {
  if (actual === null || actual === undefined) return;
  assert.fail(`${message ?? 'a node was rendered where none should be'}\n  found: ${describeNode(actual)}`);
}
