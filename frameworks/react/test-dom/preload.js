/* The DOM this directory's suites render into, installed BEFORE react-dom is
 * evaluated. Loaded with `bun test --preload frameworks/react/test-dom/preload.js`;
 * every invocation site passes it (package.json's `test:react-dom` and `test`,
 * and testStep() in scripts/check-all.mjs).
 *
 * WHY A PRELOAD AND NOT AN IMPORT. react-dom decides ONCE, at its own module
 * evaluation, whether the browser it is running in supports the `input` event:
 * `canUseDOM` gates the block that computes `isInputEventSupported`, and when
 * that block does not run the flag latches false and React falls back to its
 * LEGACY change detection — a polyfill that starts watching a field on `focusin`
 * and re-reads its value on `keydown`/`keyup`. Under that fallback a dispatched
 * `input` or `change` reaches an `onChange` handler zero times, silently: nothing
 * in the failure names the cause.
 *
 * Registering happy-dom from harness.jsx's module body is too late — ES imports
 * are evaluated before any body statement. Registering it from a SEPARATE ES
 * MODULE IMPORTED FIRST does not work either, and that is the part worth writing
 * down, because it is the obvious next thing to try: bun evaluated `react-dom`
 * ahead of it anyway. Both were settled by instrumenting react-dom's own
 * `canUseDOM` in node_modules and logging it (the tree was restored afterwards):
 * with the harness registering, `canUseDOM = false`; through this preload,
 * `canUseDOM = true`, `isInputEventSupported = true`, and a dispatched `input`
 * reaches React.
 *
 * This file must NOT be preloaded for frameworks/react/test/, which asserts on
 * renderToStaticMarkup and is DOM-free BY DESIGN — see CLAUDE.md's "React has two
 * test directories and they must not merge". Registering happy-dom there would
 * quietly change what those six suites prove.
 *
 * Nothing is ever unregistered: this directory is its own `bun test` process and
 * the process exiting is the teardown. */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// act warns without this set, since React 18 has no other way to tell it is
// running under a test renderer rather than a real browser event loop.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
