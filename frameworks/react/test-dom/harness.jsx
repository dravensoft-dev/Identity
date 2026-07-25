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
 * BUT IT DOES NOT RUN EARLY ENOUGH, and every suite in this directory pays for
 * it. ES module imports are hoisted: ALL of them evaluate before ANY body
 * statement, so `react-dom/client` below initialises while `document` is still
 * undefined. React computes `canUseDOM === false`, latches
 * `isInputEventSupported = false`, and falls back to its legacy change
 * detection — which watches a field on `focusin` and re-reads it on
 * `keydown`/`keyup` rather than listening for `input`. Measured, not inferred:
 * dispatching `input` on a plain React-controlled `<input>` here fires the
 * handler ZERO times, and surfaces a swallowed
 * `TypeError: null is not an object (evaluating 'inst.tag')` from
 * getInstIfValueChanged's null watcher.
 *
 * So, in this directory: a text field's change is driven by focus + `keyup`,
 * `onBlur` is `focusout` (React 17 moved it to the bubbling pair), and a value
 * must be written through the PROTOTYPE's `value` setter or React's
 * instance-level tracker concludes nothing changed. form-control-events.test.jsx
 * documents each at its call site.
 *
 * Fixing it means registering happy-dom before react-dom is evaluated — a
 * separate module imported first, or a dynamic import here — and it would touch
 * every suite in this directory, so it was left alone rather than folded into
 * the task that found it (plan 8C3, Task 5). See CLAUDE.md's Known debt. */
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
