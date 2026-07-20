/* Pins the host-binding shape both reference primitives (avatar, tag) settled
 * on after review: the recipe's `root` slot is bound onto the component's own
 * host element (`host: { '[class]': 'styles().root()' }`), not onto a wrapper
 * span one level inside it. In React, a component's root element IS the flex
 * item its parent row lays out; in Angular that flex item is the host, so a
 * `root` class such as `shrink-0` protects nothing unless it lives there.
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
import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { Avatar } from '../primitives/avatar/avatar';
import { avatarStyles } from '../primitives/avatar/avatar.variants';
import { Tag } from '../primitives/tag/tag';
import { tagStyles } from '../primitives/tag/tag.variants';

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
