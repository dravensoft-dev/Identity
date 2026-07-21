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
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { Avatar } from '../primitives/avatar/avatar';
import { avatarStyles } from '../primitives/avatar/avatar.variants';
import { Breadcrumbs } from '../primitives/breadcrumbs/breadcrumbs';
import type { ArenaCrumb, ArenaCrumbNavigateEvent } from '../primitives/breadcrumbs/breadcrumbs';
import { breadcrumbsStyles } from '../primitives/breadcrumbs/breadcrumbs.variants';
import { EmptyState } from '../primitives/empty-state/empty-state';
import { emptyStateStyles } from '../primitives/empty-state/empty-state.variants';
import { ErrorState } from '../primitives/error-state/error-state';
import { errorStateStyles } from '../primitives/error-state/error-state.variants';
import { Skeleton } from '../primitives/skeleton/skeleton';
import { skeletonStyles } from '../primitives/skeleton/skeleton.variants';
import { StatCard } from '../primitives/stat-card/stat-card';
import { statCardStyles } from '../primitives/stat-card/stat-card.variants';
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

@Component({
  standalone: true,
  imports: [Breadcrumbs],
  host: { 'data-host': 'breadcrumbs' },
  template: `<arena-breadcrumbs class="consumer-class" />`,
})
class BreadcrumbsHost {}

@Component({
  standalone: true,
  imports: [StatCard],
  template: `<arena-stat-card class="consumer-class" label="Revenue" value="$48.2k" />`,
})
class StatCardHost {}

@Component({
  standalone: true,
  imports: [EmptyState],
  template: `<arena-empty-state title="No projects yet" />`,
})
class EmptyStateWithoutActionHost {}

@Component({
  standalone: true,
  imports: [ErrorState],
  template: `<arena-error-state class="consumer-class" title="Something went wrong" />`,
})
class ErrorStateWithoutActionHost {}

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

test('arena-breadcrumbs: the root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-breadcrumbs') as HTMLElement;
  for (const cls of breadcrumbsStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
});

test('arena-breadcrumbs: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-breadcrumbs') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-breadcrumbs: the host itself carries the nav landmark, not a wrapper inside it', async () => {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-breadcrumbs') as HTMLElement;
  assert.equal(host.getAttribute('role'), 'navigation');
  assert.equal(host.getAttribute('aria-label'), 'Breadcrumb');
  assert.equal(host.children.length, 0, 'with no items, the trail renders no crumbs of its own');
});

/* Review finding on Task 12: `(click)="navigate.emit(crumb)"` never touched
 * the click event, so a crumb's native navigation to `crumb.href` always
 * fired alongside the output and a consumer had no way to call
 * `preventDefault()` and substitute SPA routing. The fix forwards the real
 * `MouseEvent` alongside the crumb as `ArenaCrumbNavigateEvent`.
 *
 * The template wires `(click)="onCrumbClick(crumb, $event)"`, but `items` is
 * a signal input, and this harness cannot drive a signal input through a
 * template binding here (NG0303) -- the same limitation
 * `confirm-dialog-focus-trap.test.ts` and this file's own header comment
 * document for `Skeleton`'s `variant` and `ConfirmDialog`'s `open`: the
 * harness runs `@angular/compiler`'s runtime JIT and never `ngtsc`, so a
 * signal input never reaches `ɵcmp.inputs`. Without a bound, non-empty
 * `items` array there is no real `<a>` in the DOM for this test to click.
 *
 * What IS provable for real: `onCrumbClick` is the exact method the
 * template's `(click)` binds to, not a stand-in. This test creates a real
 * `Breadcrumbs` instance via TestBed, calls that real method with a real
 * `MouseEvent`, and asserts on the actual emitted payload -- including that
 * calling `preventDefault()` on the emitted event flips the *same* event
 * object's `defaultPrevented`, proving the primitive forwards the live
 * native event rather than a copy. `bun run check:angular`
 * (`ngc --strictTemplates`) is the authority that `(click)="onCrumbClick(crumb,
 * $event)"` itself typechecks against the component's real members. */
test('arena-breadcrumbs: a crumb click forwards the real MouseEvent, so a consumer can preventDefault() the anchor\'s native navigation', async () => {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const breadcrumbs = fixture.debugElement.query(By.directive(Breadcrumbs)).componentInstance as Breadcrumbs;

  let received: ArenaCrumbNavigateEvent | undefined;
  breadcrumbs.navigate.subscribe((payload) => {
    received = payload;
  });

  const crumb: ArenaCrumb = { label: 'Clients', href: '/clients' };
  const clickEvent = new MouseEvent('click', { cancelable: true });
  (breadcrumbs as unknown as { onCrumbClick(crumb: ArenaCrumb, event: MouseEvent): void }).onCrumbClick(crumb, clickEvent);

  assert.ok(received, 'navigate did not emit');
  assert.equal(received!.crumb, crumb, 'the emitted crumb is not the same object the click targeted');
  assert.equal(
    received!.event,
    clickEvent,
    'the emitted event is not the real MouseEvent the click produced -- a consumer could not preventDefault() the actual anchor navigation',
  );
  assert.equal(clickEvent.defaultPrevented, false, 'sanity: the event starts un-prevented');
  received!.event.preventDefault();
  assert.equal(
    clickEvent.defaultPrevented,
    true,
    'calling preventDefault() on the emitted event must prevent the real anchor navigation -- proves it is the live native event, not a copy',
  );
});

test('arena-stat-card: the root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(StatCardHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-stat-card') as HTMLElement;
  for (const cls of statCardStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
});

test('arena-stat-card: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(StatCardHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-stat-card') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

/* Regression coverage for a review finding on Task 9: the action wrapper
 * used to render unconditionally regardless of whether a consumer projected
 * anything into it, shipping dead trailing space (the wrapper's own `mt-1.5`
 * inside a `gap-3` flex column) on every empty state with no action. The fix
 * gates the wrapper on `contentChild(ArenaAction)`, a marker directive
 * standing in for the `[arena-action]` CSS selector `ng-content select`
 * already used, because Angular content queries do not accept a CSS
 * selector as a locator (only a directive/component type, a template
 * reference variable, or a DI token -- confirmed against the Angular docs
 * before writing this).
 *
 * Only the negative case is provable here. `contentChild` is a signal-based
 * initializer API, the same family as `input()`, whose fields this harness
 * has twice been unable to drive (Skeleton's `variant`, ConfirmDialog's
 * `open`) because the harness runs `@angular/compiler`'s runtime template
 * JIT and never `ngtsc`, the compiler-cli transform that discovers
 * initializer-API fields and registers them into the component's static
 * metadata. Projected static content is not a bound input, so this was
 * worth trying independently -- but it hits the same wall a third time, and
 * worse: confirmed with two throwaway probes (built, run, then deleted)
 * before writing this comment. First, a component identical to `EmptyState`
 * but with the `@if` gate removed -- a plain, unconditional `ng-content` --
 * still projects the real button into the DOM under this harness, proving
 * projection itself is not the problem; its own `contentChild(ProbeAction)`
 * field nonetheless resolved to `undefined` even though the matching
 * content was genuinely there. Second, the classic decorator form,
 * `@ContentChild(ProbeAction) action?: ProbeAction`, does not merely fail to
 * update -- Angular throws `Error: Standard Angular field decorators are
 * not supported in JIT mode` the moment the decorator runs. So there is no
 * form of content query -- signal or classic -- this harness can drive, and
 * with the `@if` gate in place (as shipped) the positive case can never
 * render here: `action()` never becomes truthy, so `ng-content` never
 * mounts, so the projected button never reaches the DOM for this test to
 * find. The real authority for whether `EmptyState`'s template typechecks
 * against its real `contentChild` query is `bun run check:angular`
 * (`ngc --strictTemplates`, real `ngtsc`), not this harness -- and that gate
 * passes. The negative case below has no such gap: with nothing projected,
 * `action()` is correctly `undefined` regardless of which compiler produced
 * it, so it is real coverage of the reported bug's exact repro (an empty
 * state with no action must not ship the wrapper's dead space). */
test('arena-empty-state: the action wrapper is absent from the DOM when no [arena-action] content is projected', async () => {
  const fixture = TestBed.createComponent(EmptyStateWithoutActionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-empty-state') as HTMLElement;
  assert.equal(host.querySelector('button'), null, 'no action was projected, so no action markup should exist at all');
  const actionClass = emptyStateStyles().action().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`:scope > .${actionClass}`),
    null,
    'the action wrapper div must not render when the action slot is empty',
  );
});

test('arena-error-state: the root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(ErrorStateWithoutActionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-error-state') as HTMLElement;
  for (const cls of errorStateStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  assert.equal(host.getAttribute('role'), 'alert');
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

/* Same fix, same toolchain limitation as arena-empty-state's action wrapper
 * above (see that test's header comment for the full reasoning): the
 * positive case cannot be TestBed-rendered here because `contentChild` needs
 * ngtsc's initializer-API transform, which this JIT-only harness never runs.
 * `bun run check:angular` is the real authority that the query and the `@if`
 * gate typecheck. The negative case below is real coverage of the same
 * reported bug's exact repro, ported to `arena-error-state`'s own actions
 * slot, gated on the same shared marker directive `arena-empty-state` uses,
 * `ArenaAction` (`../primitives/projection-markers`). */
test('arena-error-state: the actions wrapper is absent from the DOM when no [arena-action] content is projected', async () => {
  const fixture = TestBed.createComponent(ErrorStateWithoutActionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-error-state') as HTMLElement;
  assert.equal(host.querySelector('button'), null, 'no action was projected, so no action markup should exist at all');
  const actionsClass = errorStateStyles().actions().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`:scope > .${actionsClass}`),
    null,
    'the actions wrapper div must not render when the actions slot is empty',
  );
});

/* Every primitive host-binds its recipe's visible slot directly onto its own
 * custom element (this file's own header comment), and an unknown element's
 * UA-default display is `inline` -- a box that a width/height utility cannot
 * size. Skeleton's `block arena-shimmer` fix (Skeleton.manifest.json) exists
 * because its `root` slot shipped without a display utility and collapsed to
 * a zero-area box under exactly that default. Sixteen more primitives are
 * still to come, so this guard is general rather than one more per-primitive
 * assertion: every directory under `primitives/` is read at run time and
 * checked against its manifest, so a future slice inherits the guard for
 * free rather than needing its own copy pasted in.
 *
 * The obvious version of this guard would render each host in this file's
 * real TestBed tree and assert `getComputedStyle(host).display !== 'inline'`
 * -- but that only proves something if the generated stylesheet is actually
 * in effect. It is not: `frameworks/tailwind/utilities.css` wraps every
 * rule in `@layer utilities { ... }`, and happy-dom's CSS engine does not
 * evaluate rules inside `@layer` at all (confirmed by hand: injecting
 * `@layer utilities { .inline-flex { display: inline-flex } }` into a
 * happy-dom document and reading `getComputedStyle` on a classed element
 * back reports `''`, not `'inline-flex'` -- the same probe with the `@layer`
 * wrapper stripped resolves correctly). A computed-style assertion here
 * would therefore pass whether or not the real utility ever applies,
 * which is worse than no guard at all -- it would look like coverage while
 * testing nothing. So this asserts the weaker but real thing instead: the
 * manifest string a real browser DOES apply carries a display utility,
 * checked as a whole word so `flex-col` cannot be mistaken for `flex`. */
const DISPLAY_UTILITY =
  /(?:^|\s)(?:block|inline-block|inline|flex|inline-flex|grid|inline-grid|table|inline-table|table-[a-z-]+|flow-root|contents|list-item|hidden)(?=\s|$)/;

function kebabToPascal(dirName: string): string {
  return dirName.split('-').map((segment) => segment[0].toUpperCase() + segment.slice(1)).join('');
}

test('every Angular primitive\'s root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  const primitivesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'primitives');
  const manifestsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tailwind', 'components');
  const names = readdirSync(primitivesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.ok(names.length > 0, 'no primitive directories found -- the guard would silently check nothing');

  for (const name of names) {
    const manifestPath = join(manifestsDir, `${kebabToPascal(name)}.manifest.json`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { slots?: Record<string, string> };
    const root = manifest.slots?.root;
    assert.ok(typeof root === 'string', `${name}: ${manifestPath} has no "slots.root" string`);
    assert.match(
      root as string,
      DISPLAY_UTILITY,
      `${name}: root slot "${root}" carries no display utility -- host-binding it collapses to the UA-default inline box`,
    );
  }
});

after(() => {
  GlobalRegistrator.unregister();
});
