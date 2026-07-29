/* A real DOM for React under `bun test`, imported by every `.dom.test.jsx` suite.
 * A suite WITHOUT that infix asserts on
 * renderToStaticMarkup, which is enough for structure and conditional branches
 * and useless for dispatching an event or holding focus — and the behaviour
 * contracts are largely about the second kind. The two run in separate `bun test`
 * invocations for that reason; see testStep() in scripts/check-all.mjs.
 *
 * Both dependencies were already devDependencies: react/react-dom because
 * frameworks/react/vendor/*.js is built from them, and happy-dom because the
 * Angular harness needs it. Nothing new is installed.
 *
 * THE DOM IS NOT REGISTERED HERE. It is installed by ./Preload.js, which every
 * invocation of the DOM suites passes as `bun test --preload`; read that file for
 * why an import cannot do the job. Registering from this module's body would put
 * the DOM in place AFTER react-dom had already evaluated, which latches React's
 * legacy change detection and stops `input` and `change` from ever reaching a
 * handler. So this module asserts the DOM is there rather than installing one as
 * a fallback: a fallback would run those suites under the legacy semantics with
 * nothing announcing it, which is exactly the failure that cost a day to find.
 * The DOM is never unregistered — the DOM suites are their own `bun test` process
 * and the process exiting is the teardown. */
if (!globalThis.document) {
  throw new Error(
    'A .dom.test.jsx suite needs its DOM installed before react-dom is evaluated. '
    + 'Run these suites as `bun test --preload ./frameworks/react/test/Preload.js '
    + '\'.dom.test.jsx\'` (or `bun run test:react-dom`).',
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
// react-dom/test-utils' act is deprecated as of React 18.3 in favor of
// React's own — the brief named the old import, but the installed react-dom
// (18.3.1) warns on every call site that still uses it.
import { act } from 'react';

export { act };

/** Every root this module created, so cleanup() can unmount all of them.
 *  @type {{root: import('react-dom/client').Root, container: HTMLElement}[]} */
const mounted = [];

/** Render a React element into a container attached to document.body and return
 *  that container. Attached rather than detached because focus and `:focus`
 *  behave differently on a detached tree.
 *  @param {React.ReactElement} element
 *  @returns {HTMLElement} */
export function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(element); });
  mounted.push({ root, container });
  return container;
}

/** Unmount everything mount() created and empty the body. Call it from an
 *  afterEach; a container left behind is found by the next test's querySelector. */
export function cleanup() {
  while (mounted.length) {
    const { root, container } = mounted.pop();
    act(() => { root.unmount(); });
    container.remove();
  }
  document.body.innerHTML = '';
}
