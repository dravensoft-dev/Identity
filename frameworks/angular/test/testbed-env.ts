/* One DOM and one TestBed environment for the whole directory.
 *
 * `bun test` runs every file here in ONE process, and two globals in that process
 * can each be claimed only once. Both used to be claimed by convention rather
 * than by a mechanism, and the convention had a cost: any suite needing a real
 * component render had to be appended to host-class-binding.test.ts, whatever it
 * was about, because that file owned the one `TestBed.initTestEnvironment()` call
 * anyone was allowed to make.
 *
 * The two claims are not independent, which is the part worth writing down.
 *
 *   happy-dom. `GlobalRegistrator.register()` THROWS when it is already
 *   registered, so every suite used to pair its own `register()` with an
 *   `unregister()` in an `after` hook. Each pair installs a NEW window with a NEW
 *   document.
 *
 *   Angular. `TestBed.resetTestEnvironment()` genuinely lets a second suite
 *   initialise a platform -- but it does not undo everything the first one did.
 *   `BrowserDomAdapter.makeCurrent()` installs a process-wide DOM adapter on the
 *   FIRST platform creation and nothing resets it, so the adapter keeps pointing
 *   at whichever document was live then.
 *
 * Put together: a per-file document plus a process-wide adapter means the second
 * rendering suite renders into a document that is no longer the global one.
 * Measured, not feared -- with per-file registration kept and only the TestBed
 * call shared, four of host-class-binding.test.ts's own tests failed with
 * `getComputedStyle(host).display` returning `''`, because the element belonged
 * to one document and the reader to another. Resetting the environment did not
 * fix it, for the adapter reason above.
 *
 * So the document is claimed once, by whichever suite asks first, and is never
 * torn down. `unregister()` only closes the window and restores the pre-test
 * globals, which matters at the end of a process that is about to exit anyway.
 *
 * Both must stay FUNCTIONS rather than side effects at module scope: ESM hoists
 * imports above the importing module's body, and a suite that registered happy-dom
 * in its own body would find this module had already run first. Call `ensureDom()`
 * at the top of the body, before anything touches `document`. */
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

/** Register happy-dom globally, at most once per process. Every suite in this
 *  directory that touches `document` calls this instead of registering its own,
 *  so the whole directory shares one document -- see this file's header for why
 *  a per-file document is not merely wasteful but wrong. */
export function ensureDom(): void {
  if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();
}

let claimed = false;

/** Initialise the shared TestBed environment, at most once per process. Call it
 *  after `ensureDom()`. */
export function useTestEnvironment(): void {
  ensureDom();
  if (claimed) return;
  claimed = true;
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
}
