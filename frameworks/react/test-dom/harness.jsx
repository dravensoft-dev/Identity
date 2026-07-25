/* A real DOM for React under `bun test`. frameworks/react/test/ asserts on
 * renderToStaticMarkup, which is enough for structure and conditional branches
 * and useless for dispatching an event or holding focus — and the behaviour
 * contracts are largely about the second kind.
 *
 * Both dependencies were already devDependencies: react/react-dom because
 * frameworks/react/vendor/*.js is built from them, and happy-dom because the
 * Angular harness needs it. Nothing new is installed.
 *
 * GlobalRegistrator.register() runs at import time, exactly as
 * frameworks/angular/test/*.ts does it — a lazy register inside mount() would
 * leave `document` undefined for a suite's top-level code. It is never
 * unregistered here: this directory is its own `bun test` process and the
 * process exiting is the teardown.
 *
 * REACT USES ITS LEGACY CHANGE DETECTION IN HERE, and every suite pays for it.
 * This is the observed behaviour, measured repeatedly:
 *
 *   - dispatching `input` on a React-controlled `<input>` fires `onChange`
 *     ZERO times. So does dispatching `change`.
 *   - focus followed by `keyup` DOES fire it — which is React's legacy polyfill
 *     path, the one that watches a field on `focusin` and re-reads it on
 *     `keydown`/`keyup` instead of listening for `input`.
 *   - `onBlur` is `focusout`; React 17 moved it onto the bubbling pair.
 *   - a value must be written through the PROTOTYPE's `value` setter, or
 *     React's instance-level tracker concludes nothing changed.
 *   - a swallowed `TypeError: null is not an object (evaluating 'inst.tag')`
 *     surfaces from getInstIfValueChanged's null watcher, which is that same
 *     legacy path running with no watched element.
 *
 * WHY is NOT established, and one plausible explanation has been TESTED AND
 * FALSIFIED — do not retry it. The obvious hypothesis is import ordering: ES
 * imports are hoisted, so `react-dom/client` below would initialise while
 * `document` is undefined, `canUseDOM` would be false and
 * `isInputEventSupported` would latch false. That was measured and it is NOT
 * the cause: registering happy-dom from a separate module imported BEFORE
 * `react-dom/client` puts a real `document` in place first — verified by
 * logging at both points — and `input` still reaches React zero times.
 * `'oninput' in document` is true here and `document.documentMode` is
 * undefined, so React's own feature test should pass. The mechanism is open.
 *
 * Whoever picks this up: start by instrumenting react-dom's `canUseDOM` and
 * `isInputEventSupported` directly rather than reasoning about module order,
 * and note the fix would touch every suite in this directory — the six tests in
 * form-control-events.test.jsx are written against the legacy semantics and
 * would all need rewriting. See CLAUDE.md's Known debt. (plan 8C3, Task 5) */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!globalThis.document) GlobalRegistrator.register();

// act warns without this set, since React 18 has no other way to tell it is
// running under a test renderer rather than a real browser event loop.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
