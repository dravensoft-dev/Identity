/* Pins the host-binding shape the reference primitives (avatar, tag) settled
 * on after review, and that every later primitive follows: the recipe's
 * visible slot is bound onto the component's own host element
 * (`host: { '[class]': 'styles().root()' }`), not onto a wrapper span one
 * level inside it. In React, a component's root element IS the flex item its
 * parent row lays out; in Angular that flex item is the host, so a `root`
 * class such as `shrink-0` protects nothing unless it lives there. Skeleton
 * (below) is the one variation: its host binds to whichever slot is actually
 * visible for the current variant (`root`, or `stack` when `variant="text"`),
 * because `root` alone is `hidden` in that case -- same principle, one more
 * level of indirection.
 *
 * A host `[class]` binding could instead have clobbered a consumer's own
 * `class="..."` attribute on `<arena-avatar>` / `<arena-tag>` — Angular's own
 * docs (https://angular.dev/guide/templates/binding, "CSS class and style
 * property bindings") say static classes, `[class]` bindings and `[class.x]`
 * bindings on one element are always combined, never treated as an
 * assignment. This suite renders a real component tree (TestBed, with
 * happy-dom standing in for the DOM `bun test` does not otherwise provide) to
 * confirm that promise holds for a *host* binding specifically, not just a
 * template one. `TestBed` runs zoneless automatically here because zone.js is
 * not one of this repo's dependencies (Angular's own zoneless guide: "If
 * zone.js is not present, TestBed runs zoneless by default").
 *
 * This is the one test in the layer that needs a DOM: everything else in this
 * directory asserts against the plain-TypeScript `.variants.ts` recipe, per
 * this suite's own header comment in tag-variants.test.ts. */
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

import '@angular/compiler';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { Avatar } from '../primitives/avatar/avatar';
import { avatarStyles } from '../primitives/avatar/avatar.variants';
import { Skeleton } from '../primitives/skeleton/skeleton';
import { skeletonStyles } from '../primitives/skeleton/skeleton.variants';
import { Tag } from '../primitives/tag/tag';
import { tagStyles } from '../primitives/tag/tag.variants';

/* Only ONE file in this directory may call TestBed.initTestEnvironment():
 * bun runs every test file in one process, and Angular's TestBed throws
 * ("Cannot set base providers because it has already been called") the
 * second time it is called across files that ran together. Skeleton's
 * host-binding coverage lives here, beside Tag's and Avatar's, for exactly
 * that reason rather than in a file of its own.
 *
 * It stops at Skeleton's default variant. This harness runs each test file
 * through bun's own TypeScript stripping plus `@angular/compiler`'s runtime
 * template JIT -- it never runs `ngtsc`, the compiler-cli AST transform that
 * discovers a class's `input()` fields and registers them into `ɵcmp.inputs`.
 * Without that transform a signal input is invisible to both template
 * property binding (`[lines]="3"` fails NG0303, "not a known property") and
 * `ComponentRef.setInput()` (same NG0303) -- confirmed with an isolated
 * throwaway component before this was written, so it is a property of the
 * harness, not of Skeleton, Tag or Avatar. `variant="text"` therefore cannot
 * be driven through a bound TestBed template here; only literal defaults
 * render. skeleton-variants.test.ts covers every variant's class output
 * against the plain-TypeScript recipe instead, which this limitation does
 * not touch, and `bun run check:angular` runs the real `ngc --strictTemplates`
 * -- the actual authority on whether skeleton.ts's `@if`/`@for` template
 * typechecks against the component's real inputs. */
TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

@Component({
  standalone: true,
  imports: [Avatar],
  template: `<arena-avatar class="consumer-class" name="Juan Carlos" />`,
})
class AvatarHost {}

@Component({
  standalone: true,
  imports: [Tag],
  template: `<arena-tag class="consumer-class">Blocked</arena-tag>`,
})
class TagHost {}

@Component({
  standalone: true,
  imports: [Skeleton],
  template: `<arena-skeleton class="consumer-class" />`,
})
class SkeletonHost {}

test('arena-avatar: the root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(AvatarHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-avatar') as HTMLElement;
  for (const cls of avatarStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
});

test('arena-avatar: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(AvatarHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-avatar') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-tag: the root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(TagHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-tag') as HTMLElement;
  for (const cls of tagStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
});

test('arena-tag: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(TagHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-tag') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-skeleton: the default variant\'s root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(SkeletonHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-skeleton') as HTMLElement;
  for (const cls of skeletonStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
});

test('arena-skeleton: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(SkeletonHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-skeleton') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-skeleton: the host itself carries the loading status, not a wrapper inside it', async () => {
  const fixture = TestBed.createComponent(SkeletonHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-skeleton') as HTMLElement;
  assert.equal(host.getAttribute('role'), 'status');
  assert.equal(host.getAttribute('aria-label'), 'Loading');
  assert.equal(host.children.length, 0, 'the default (non-stacked) variant renders no children of its own');
});

after(() => {
  GlobalRegistrator.unregister();
});
