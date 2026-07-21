/* Pins the host-binding shape the reference primitives (avatar, tag) settled
 * on after review, and that every later primitive follows except
 * `arena-theme-toggle`: the recipe's visible slot is bound onto the
 * component's own host element (`host: { '[class]': 'styles().root()' }`),
 * not onto a wrapper span one level inside it. In React, a component's root
 * element IS the flex item its parent row lays out; in Angular that flex
 * item is the host, so a `root` class such as `shrink-0` protects nothing
 * unless it lives there. Skeleton (below) is the one variation: its host
 * binds to whichever slot is actually visible for the current variant
 * (`root`, or `stack` when `variant="text"`), because `root` alone is
 * `hidden` in that case -- same principle, one more level of indirection.
 * `arena-theme-toggle` is the one exception rather than a variation: its
 * root is a real `<button>` rendered inside its own unstyled host, not a
 * binding on the host at all, because a native interactive control cannot be
 * an unknown custom element (see components-divergences.md, "ThemeToggle is
 * the one Angular primitive that does not host-bind its root").
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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { AppLogo } from '../primitives/app-logo/app-logo';
import { appLogoStyles } from '../primitives/app-logo/app-logo.variants';
import { Avatar } from '../primitives/avatar/avatar';
import { avatarStyles } from '../primitives/avatar/avatar.variants';
import { BarChart } from '../primitives/bar-chart/bar-chart';
import { Breadcrumbs } from '../primitives/breadcrumbs/breadcrumbs';
import type { ArenaCrumb, ArenaCrumbNavigateEvent } from '../primitives/breadcrumbs/breadcrumbs';
import { breadcrumbsStyles } from '../primitives/breadcrumbs/breadcrumbs.variants';
import { BulkActionBar } from '../primitives/bulk-action-bar/bulk-action-bar';
import { bulkActionBarStyles } from '../primitives/bulk-action-bar/bulk-action-bar.variants';
import { ChartCard } from '../primitives/chart-card/chart-card';
import { chartCardStyles } from '../primitives/chart-card/chart-card.variants';
import { DoughnutChart } from '../primitives/doughnut-chart/doughnut-chart';
import { EmptyState } from '../primitives/empty-state/empty-state';
import { emptyStateStyles } from '../primitives/empty-state/empty-state.variants';
import { ErrorState } from '../primitives/error-state/error-state';
import { errorStateStyles } from '../primitives/error-state/error-state.variants';
import { LineChart } from '../primitives/line-chart/line-chart';
import { PageHead } from '../primitives/page-head/page-head';
import { pageHeadStyles } from '../primitives/page-head/page-head.variants';
import { Skeleton } from '../primitives/skeleton/skeleton';
import { skeletonStyles } from '../primitives/skeleton/skeleton.variants';
import { StatCard } from '../primitives/stat-card/stat-card';
import { statCardStyles } from '../primitives/stat-card/stat-card.variants';
import { Tag } from '../primitives/tag/tag';
import { tagStyles } from '../primitives/tag/tag.variants';
import { ThemeToggle } from '../primitives/theme-toggle/theme-toggle';
import { ThemeService } from '../theme/theme-service';

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

/* `name` is `input.required<string>()` (Resolution D of task 24's brief: nothing
 * defaults, on purpose -- an empty lock-up would ship no one's mark by omission,
 * so there is no fallback value to fall back to). A static literal attribute in
 * a template does not route to a signal input under this JIT-only harness (the
 * file header above documents why for Skeleton's `variant` and Breadcrumbs'
 * `items`), so this host exists only to prove what DOES happen with one --
 * `AppLogoStrayAttributeTest` below never calls `detectChanges()`, because
 * `name()` throws NG0950 ("Input is required but no value is available yet")
 * the moment the child's template tries to read it, since the required input
 * was truly never satisfied under this harness, not merely defaulted quietly
 * the way an optional input is. */
@Component({
  standalone: true,
  imports: [AppLogo],
  template: `<arena-app-logo name="Draven" class="consumer-class"><span>mark</span></arena-app-logo>`,
})
class AppLogoStaticAttributeHost {}

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
  imports: [BulkActionBar],
  host: { 'data-host': 'bulk-action-bar' },
  template: `<arena-bulk-action-bar class="consumer-class" />`,
})
class BulkActionBarHost {}

@Component({
  standalone: true,
  imports: [ChartCard],
  host: { 'data-host': 'chart-card' },
  template: `<arena-chart-card class="consumer-class" />`,
})
class ChartCardHost {}

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

@Component({
  standalone: true,
  imports: [PageHead],
  host: { 'data-host': 'page-head' },
  template: `<arena-page-head class="consumer-class" />`,
})
class PageHeadWithoutActionsHost {}

@Component({
  standalone: true,
  imports: [ThemeToggle],
  template: `<arena-theme-toggle />`,
})
class ThemeToggleHost {}

@Component({
  standalone: true,
  imports: [BarChart],
  host: { 'data-host': 'bar-chart' },
  template: `<arena-bar-chart />`,
})
class BarChartHost {}

@Component({
  standalone: true,
  imports: [LineChart],
  host: { 'data-host': 'line-chart' },
  template: `<arena-line-chart />`,
})
class LineChartHost {}

@Component({
  standalone: true,
  imports: [DoughnutChart],
  host: { 'data-host': 'doughnut-chart' },
  template: `<arena-doughnut-chart />`,
})
class DoughnutChartHost {}

/* `arena-app-logo` is the first primitive in this layer with a `required`
 * signal input (`name`). Every other component's optional signal inputs are
 * undrivable through a TestBed template binding (NG0303) or a literal
 * attribute (a silent no-op that leaves the field at its default) under this
 * JIT-only harness -- documented at the top of this file. A required input
 * has no default to fall back to, so neither path renders the component at
 * all: it throws NG0950 ("Input is required but no value is available yet")
 * the instant the template reads it during change detection, proven by
 * `AppLogoStaticAttributeHost`'s own test below, which deliberately never
 * calls `detectChanges()` for exactly that reason.
 *
 * What DOES work, probed by hand before writing this: `TestBed.createComponent
 * (AppLogo)` (skipping a host wrapper, so AppLogo itself is the fixture's root)
 * creates the instance without running change detection, and at that point
 * `instance.name` / `instance.dim` are still just plain writable object
 * properties -- `input.required()` is a class-field assignment, not something
 * TypeScript's `readonly` enforces at runtime, and nothing about it depends on
 * ngtsc's initializer-API transform (the transform is what wires a *binding*
 * to the field; the field itself exists the moment the class is constructed).
 * Overwriting `instance.name` with a plain function that returns a fixed
 * string before the first `detectChanges()` bypasses Angular's input system
 * entirely -- no `ɵcmp.inputs` lookup, no required-input check -- while still
 * running the REAL compiled template through REAL change detection against
 * the REAL `AppLogo` class. It is not a stand-in component with a look-alike
 * template: it is this component, rendered for real, with its one otherwise
 * unreachable input satisfied by direct assignment instead of a binding. */
function renderAppLogo(name: string, dim?: string) {
  const fixture = TestBed.createComponent(AppLogo);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['name'] = () => name;
  if (dim !== undefined) instance['dim'] = () => dim;
  return fixture;
}

test('arena-app-logo: the root recipe classes land on the host element itself', () => {
  const fixture = renderAppLogo('Draven');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  for (const cls of appLogoStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  fixture.destroy();
});

test('arena-app-logo: a class already on the host before the first detectChanges survives the [class] host binding', () => {
  const fixture = renderAppLogo('Draven');
  // Stands in for a consumer's static `class="..."` attribute the way the other
  // primitives' *Host wrapper components carry one in their own template -- not
  // reachable here via a wrapper because a wrapper's own detectChanges would
  // recurse into AppLogo's template and hit the required-input throw this
  // block's header comment explains. Setting the token directly on the DOM
  // node before Angular's own host `[class]` binding ever runs is a faithful
  // stand-in: Angular's class binding adds/removes only the tokens it itself
  // manages (per Angular's own docs on class/style bindings, cited in this
  // file's header comment) and must leave an unrelated token alone either way.
  (fixture.nativeElement as HTMLElement).classList.add('consumer-class');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the pre-existing class: "${host.className}"`);
  for (const cls of appLogoStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  fixture.destroy();
});

/* Resolution C of task 24's brief: the two-ink wordmark (`DRAVEN` + `SOFT`) is
 * ONE WORD split into two inks, and `app-logo.ts`'s template places `@if
 * (dim(); as tail) {...}` immediately after `{{ name() }}` -- and the second
 * `<span>` immediately after `{{ tail }}` -- with no whitespace anywhere in
 * the source between them, entirely on one template-literal line, because
 * Angular's own whitespace handling (collapsing runs of whitespace between
 * inline nodes, generally NOT inserting any where the source has none) is a
 * real behaviour to verify against a real render, not to assume survives from
 * React's JSX. This is that verification: a real `AppLogo` instance, real
 * `@angular/compiler` JIT template compilation, real DOM. */
test('arena-app-logo: the two-ink wordmark renders as one word with no space -- "DRAVEN" + "SOFT" reads as exactly "DRAVENSOFT"', () => {
  const fixture = renderAppLogo('DRAVEN', 'SOFT');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const nameClass = appLogoStyles().name().split(/\s+/)[0];
  const nameEl = host.querySelector(`.${nameClass}`) as HTMLElement;
  assert.ok(nameEl, 'the name slot did not render');
  assert.equal(
    nameEl.textContent,
    'DRAVENSOFT',
    `expected the wordmark to read as one word with no space, got ${JSON.stringify(nameEl.textContent)}`,
  );
  // The first child must be exactly the text node "DRAVEN" -- no leading or
  // trailing whitespace collapsed in from the template's own indentation --
  // and the next must be the `dim` span wrapping exactly "SOFT", proving the
  // concatenation is real DOM adjacency and not a coincidental textContent match
  // (e.g. two nodes each carrying a stray space that happen to net to none). The
  // `@if` block leaves its own anchor comment node behind regardless of which
  // branch rendered (confirmed below, and by the sibling "no dim" test), so
  // comments are filtered out here rather than asserted into an exact count.
  const significant = Array.from(nameEl.childNodes).filter((n) => n.nodeType !== Node.COMMENT_NODE);
  assert.equal(significant.length, 2, `expected exactly two non-comment child nodes, got ${significant.length}`);
  assert.equal(significant[0].nodeType, Node.TEXT_NODE);
  assert.equal(significant[0].textContent, 'DRAVEN');
  const dimEl = significant[1] as HTMLElement;
  assert.equal(dimEl.nodeType, Node.ELEMENT_NODE);
  assert.equal(dimEl.textContent, 'SOFT');
  const dimClass = appLogoStyles().dim().split(/\s+/)[0];
  assert.ok(dimEl.classList.contains(dimClass), `the dim span is missing its recipe class "${dimClass}"`);
  fixture.destroy();
});

test('arena-app-logo: with no dim, the wordmark renders the name alone and no dim span at all', () => {
  const fixture = renderAppLogo('Draven');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const nameClass = appLogoStyles().name().split(/\s+/)[0];
  const nameEl = host.querySelector(`.${nameClass}`) as HTMLElement;
  assert.equal(nameEl.textContent, 'Draven');
  // The `@if` control-flow block leaves its own anchor comment node behind even
  // when it does not render (Angular's usual `ng-container`-style bookkeeping) --
  // that comment does not count toward textContent (confirmed above: it never
  // appeared in "DRAVENSOFT") and is not an element, so it is excluded here by
  // node type rather than asserted away entirely.
  for (const node of Array.from(nameEl.childNodes))
    assert.notEqual(node.nodeType, Node.ELEMENT_NODE, 'no dim was set, so no dim <span> should render');
  // `dim`'s own recipe class contains a `/` (an opacity modifier, e.g.
  // "text-base-content/62"), which is not a valid bare CSS class selector --
  // querySelector(`.${cls}`) throws a DOMException on it. `.children` sidesteps
  // that: with no dim rendered, the name slot has no element children at all.
  assert.equal(nameEl.children.length, 0, 'no dim was set, so the name slot should have no element children');
  fixture.destroy();
});

/* Resolution J of task 24's brief: known layer-wide issue, not fixed here. An
 * input named `name` collides with a real global HTML attribute, the same
 * class of problem `components-divergences.md` and the brief record for
 * `title`. Proven here: a static literal `name="Draven"` on `<arena-app-logo>`
 * lands on the host as a plain DOM attribute BEFORE Angular ever runs change
 * detection (Angular sets an element's static, non-bound attributes during
 * its template's creation pass, which for a nested component runs as part of
 * its parent's own construction -- `TestBed.createComponent(Host)` alone is
 * enough, with no `detectChanges()` call, confirmed by hand before writing
 * this) -- a stray, inert attribute that never reaches the component's own
 * `name` signal input, which stays unset and would throw NG0950 the moment
 * anything tried to read it. `detectChanges()` is deliberately never called
 * in this test for that reason: it would throw before either assertion ran --
 * and for the same reason `fixture.destroy()` runs at the end: TestBed
 * attaches every created fixture to the shared `ApplicationRef`, and a later
 * test's own `detectChanges()` walks every still-attached view (zoneless CD
 * has no per-component isolation) -- confirmed by hand: without this
 * `destroy()`, the very next test in file order (`arena-avatar`'s) failed
 * with this same NG0950, thrown out of THIS fixture's still-pending required
 * input while detecting changes for an entirely unrelated component. */
test('arena-app-logo: a static "name" attribute lands as a stray DOM attribute on the host, not as the component input -- known layer-wide issue, not fixed here (Resolution J)', () => {
  const fixture = TestBed.createComponent(AppLogoStaticAttributeHost);
  const host = fixture.nativeElement.querySelector('arena-app-logo') as HTMLElement;
  assert.equal(host.getAttribute('name'), 'Draven', 'the literal attribute should still land on the host element itself');
  assert.equal(host.getAttribute('class'), 'consumer-class', 'sanity: the static class attribute lands the same way');
  fixture.destroy();
});

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

/* BulkActionBar's whole presence is driven by `count` alone (React's
 * `BulkActionBar.jsx` returns `null` at zero) -- following ConfirmDialog's
 * resolution for the same shape, the host stays permanently in the DOM and a
 * `open` variant toggles `hidden`, rather than wrapping the host itself in
 * an `@if`. `count` defaults to 0, so `bulkActionBarStyles()`'s own default
 * output already includes `hidden` -- this is real coverage, not a stand-in,
 * of a real TestBed render landing that default state on the actual host. */
test('arena-bulk-action-bar: the root recipe classes land on the host element itself, hidden by the default count of 0', async () => {
  const fixture = TestBed.createComponent(BulkActionBarHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bulk-action-bar') as HTMLElement;
  for (const cls of bulkActionBarStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  assert.ok(host.classList.contains('hidden'), 'a bar with no selection (the default count of 0) must render hidden');
});

test('arena-bulk-action-bar: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(BulkActionBarHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bulk-action-bar') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-bulk-action-bar: the host renders no children while count is 0 (the default) -- nothing focusable exists behind the hidden bar', async () => {
  const fixture = TestBed.createComponent(BulkActionBarHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bulk-action-bar') as HTMLElement;
  assert.equal(host.children.length, 0, 'with no selection, the interactive content gated by @if (count() > 0) must not be in the DOM at all');
});

test('arena-chart-card: the root recipe classes land on the host element itself', async () => {
  const fixture = TestBed.createComponent(ChartCardHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-chart-card') as HTMLElement;
  for (const cls of chartCardStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
});

test('arena-chart-card: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = TestBed.createComponent(ChartCardHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-chart-card') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

/* The bare case: no `title` and nothing projected into `[arena-actions]` or
 * the default slot. Only this negative path is provable here. A positive
 * render (binding `title="..."` in a host template, the same literal-attribute
 * shape `arena-empty-state`'s and `arena-error-state`'s own `title="..."`
 * tests use above) was tried and probed by hand first: under this harness a
 * literal `title` attribute on `<arena-chart-card>` does NOT reach the
 * component's `input<string>()` at all -- `ɵcmp.inputs` for a signal-only
 * input is populated by ngtsc's initializer-API transform, which this JIT
 * harness never runs, so the compiler falls back to treating `title` as a
 * plain HTML global attribute (it happens to be a legal one) instead of
 * routing it to the input. The probe confirmed `host.getAttribute('title')`
 * is set while the component's own `title()` stays `undefined` and the head
 * row never renders -- the same family of gap `host-class-binding.test.ts`
 * already documents for Skeleton's `variant` and Breadcrumbs' `items` (there
 * it throws NG0303 through a bracket binding; here it silently no-ops
 * through a literal one, because `title` happens to collide with a real
 * global attribute name -- the same collision `components-divergences.md`
 * and this plan's Resolution J record as a known, unfixed layer-wide issue).
 * `contentChild(ArenaActions)` has the identical positive-case gap for the
 * same ngtsc reason (see arena-empty-state's own comment above). So neither
 * half of `@if (title() || actions())` can be driven true here; what IS real
 * coverage is the negative path -- with both undefined, the whole head row,
 * not just the actions wrapper inside it, must be absent, matching React's
 * `{(title || actions) && (...)}` gate rather than the task brief's
 * unconditional `head`. `bun run check:angular` (`ngc --strictTemplates`)
 * is the authority that the gate and the `contentChild` query typecheck
 * against the component's real members. */
test('arena-chart-card: the head row is entirely absent when there is neither a title nor projected actions', async () => {
  const fixture = TestBed.createComponent(ChartCardHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-chart-card') as HTMLElement;
  const headClass = chartCardStyles().head().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`.${headClass}`),
    null,
    'an empty chart card (no title, no actions) must not render the head row at all',
  );
  assert.equal(host.children.length, 0, 'a bare chart card renders no children of its own');
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

/* `arena-page-head` is the layer's first consumer of `container-size.ts`, and
 * the first primitive whose host classes depend on a runtime measurement of
 * that same host. Two things make this real coverage rather than a restatement
 * of the recipe.
 *
 * First, happy-dom ships a `ResizeObserver` constructor that never fires (no
 * layout engine -- probed by hand: `observe()` on a real element produced zero
 * callbacks over 100ms). So `containerWidth()`'s signal genuinely stays at its
 * pre-measure `null` here, which is exactly the state the "render WIDE on
 * null, so the narrow branch never flashes" rule is about.
 *
 * Second, `--bp-sm` is set on the real document root below before the first
 * `<arena-page-head>` is constructed, so `readBreakpoint('sm')` resolves to a
 * live 480 rather than the `NaN` an unstyled happy-dom document would give.
 * That makes the comparison a real one that could have gone the other way: had
 * the helper started the width at 0 instead of `null`, `0 < 480` would select
 * the narrow branch and these assertions would fail. (`page-head-variants.test.ts`
 * deliberately touches only `--bp-md`/`--bp-lg` so its stubbed reads can never
 * poison the module-level cache this file depends on, in either file order.) */
const BP_SM = '480px';

test('arena-page-head: the root recipe classes land on the host element itself', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  const fixture = TestBed.createComponent(PageHeadWithoutActionsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
  for (const cls of pageHeadStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-page-head: an unmeasured width renders the WIDE layout, so the narrow branch never flashes on first paint', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  const fixture = TestBed.createComponent(PageHeadWithoutActionsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
  assert.ok(host.classList.contains('flex-row'), `an unmeasured page head must render as a row: "${host.className}"`);
  assert.ok(host.classList.contains('items-start'), `an unmeasured page head must render top-aligned: "${host.className}"`);
  assert.ok(!host.classList.contains('flex-col'), 'the narrow branch must not render before anything has been measured');
});

/* Same fix, same toolchain limitation as arena-empty-state's action wrapper
 * above (see that test's header comment for the full reasoning): the positive
 * case cannot be TestBed-rendered here because `contentChild` needs ngtsc's
 * initializer-API transform, which this JIT-only harness never runs, and with
 * the `@if` gate in place `actions()` can never become truthy for it to
 * mount. `bun run check:angular` is the real authority that the query and the
 * gate typecheck. The negative case below is real coverage of the same
 * reported bug's exact repro, ported to `arena-page-head`'s own actions slot:
 * that slot sits in a `gap-4` flex parent and carries `shrink-0` plus its own
 * `w-auto`/`w-full`, so an unprojected wrapper would ship a gap's worth of
 * dead space to every page with no actions. It is gated on the shared
 * `ArenaActions` marker (`../primitives/projection-markers`), the plural
 * sibling of the `ArenaAction` that `arena-empty-state` uses. */
test('arena-page-head: the actions wrapper is absent from the DOM when no [arena-actions] content is projected', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  const fixture = TestBed.createComponent(PageHeadWithoutActionsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
  assert.equal(host.querySelector('button'), null, 'no actions were projected, so no action markup should exist at all');
  const actionsClass = pageHeadStyles().actions().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`:scope > .${actionsClass}`),
    null,
    'the actions wrapper div must not render when the actions slot is empty',
  );
  assert.equal(host.children.length, 1, 'a page head with no actions renders the titles block and nothing else');
});

/* `containerWidth()` guards its observer with `typeof ResizeObserver ===
 * 'undefined'`, for a platform that has none -- server-side rendering being
 * the case that matters. Without the guard, `new ResizeObserver(...)` inside
 * `afterNextRender` is a ReferenceError. Deleting the global for the duration
 * of one render is the only way to reach that branch here, since happy-dom
 * does provide the constructor. */
test('arena-page-head: a platform with no ResizeObserver still renders, on the wide layout', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  const globals = globalThis as { ResizeObserver?: typeof ResizeObserver };
  const saved = globals.ResizeObserver;
  delete globals.ResizeObserver;
  try {
    const fixture = TestBed.createComponent(PageHeadWithoutActionsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
    assert.ok(host.classList.contains('flex-row'), `with no ResizeObserver the width stays null, which is the wide layout: "${host.className}"`);
  } finally {
    globals.ResizeObserver = saved;
  }
});

/* ThemeToggle is the layer's first primitive to inject a service
 * (ThemeService) and the only one so far whose styled `root` is NOT
 * host-bound -- its root must be a real `<button>` for keyboard operability,
 * and `<arena-theme-toggle>` cannot itself become one (components-
 * divergences.md records this as a deliberate structural divergence). It is
 * also the first primitive in this file with no signal inputs at all, so
 * none of the NG0303 limitation the tests above document (Skeleton's
 * `variant`, Breadcrumbs' `items`, PageHead's measured width) applies here
 * -- there is no input this harness would need ngtsc to drive. A real
 * TestBed render can therefore exercise the whole chain for real: a real
 * click calling the component's `toggle()`, which calls the shared
 * `ThemeService.toggle()`, whose own `effect()` writes the `arena-light`
 * class onto the real document, which feeds back into the component's
 * `dark` computed and what it renders next.
 *
 * `ThemeService` is `providedIn: 'root'`, so it is one singleton shared by
 * every test in this file's TestBed environment -- nothing here ever calls
 * `TestBed.resetTestingModule()` (see this file's own header comment on why
 * only one file may call `initTestEnvironment()` at all). `resetTheme()`
 * below puts it back to Arena's dark default at the top of each of the three
 * tests that follow, so they cannot depend on execution order among
 * themselves or leave the class on `<html>` in a state a later one would
 * trip over. It is called per-test rather than as a file-level `beforeEach`
 * so the ~20 unrelated tests above it -- none of which touch ThemeService --
 * never pay for a reset they do not need. */
function resetTheme(): void {
  TestBed.inject(ThemeService).set('dark');
  document.documentElement.classList.remove('arena-light');
}

test('arena-theme-toggle: starts dark -- aria-pressed true and the sun glyph, the state it is currently IN', async () => {
  resetTheme();
  const fixture = TestBed.createComponent(ThemeToggleHost);
  fixture.detectChanges();
  await fixture.whenStable();

  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  assert.equal(button.getAttribute('aria-pressed'), 'true', 'dark is Arena\'s default, so aria-pressed must report true');
  assert.equal(button.getAttribute('aria-label'), 'Switch to light theme');

  const icon = button.querySelector('i') as HTMLElement;
  assert.ok(icon.classList.contains('ph-sun'), `expected the sun glyph while dark -- the icon shows the state you are IN: "${icon.className}"`);
  assert.ok(!icon.classList.contains('ph-moon'));
});

test('arena-theme-toggle: a real click flips ThemeService\'s own signal and the arena-light class on <html>, not just local component state', async () => {
  resetTheme();
  const fixture = TestBed.createComponent(ThemeToggleHost);
  fixture.detectChanges();
  await fixture.whenStable();

  const service = TestBed.inject(ThemeService);
  assert.equal(service.theme(), 'dark', 'sanity: starts dark');
  assert.ok(!document.documentElement.classList.contains('arena-light'), 'sanity: starts without the light class');

  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  button.click();
  fixture.detectChanges();
  await fixture.whenStable();

  assert.equal(
    service.theme(),
    'light',
    'ThemeService\'s own signal must have flipped -- proves the component calls the shared service\'s toggle() rather than reimplementing the light/dark switch locally',
  );
  assert.ok(
    document.documentElement.classList.contains('arena-light'),
    'ThemeService\'s own effect must have applied the class change to the real document -- that is the service\'s job, not the component\'s',
  );

  assert.equal(button.getAttribute('aria-pressed'), 'false', 'aria-pressed must report the CURRENT (now light) state, not the state before the click');
  assert.equal(button.getAttribute('aria-label'), 'Switch to dark theme');
  const icon = button.querySelector('i') as HTMLElement;
  assert.ok(
    icon.classList.contains('ph-moon'),
    `expected the moon glyph now that the theme is light -- the icon shows the state you are IN, never the state a click would move you to: "${icon.className}"`,
  );
  assert.ok(!icon.classList.contains('ph-sun'));
});

test('arena-theme-toggle: a second click flips back to dark -- the toggle is not a one-shot', async () => {
  resetTheme();
  const fixture = TestBed.createComponent(ThemeToggleHost);
  fixture.detectChanges();
  await fixture.whenStable();

  const service = TestBed.inject(ThemeService);
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  button.click();
  fixture.detectChanges();
  await fixture.whenStable();
  assert.equal(service.theme(), 'light');

  button.click();
  fixture.detectChanges();
  await fixture.whenStable();

  assert.equal(service.theme(), 'dark');
  assert.ok(!document.documentElement.classList.contains('arena-light'));
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  const icon = button.querySelector('i') as HTMLElement;
  assert.ok(icon.classList.contains('ph-sun'));
});

/* Every primitive except `arena-theme-toggle` host-binds its recipe's
 * visible slot directly onto its own custom element (this file's own header
 * comment) -- `arena-theme-toggle`'s root is a real `<button>` instead,
 * since a native interactive control cannot be an unknown custom element;
 * see components-divergences.md ("ThemeToggle is the one Angular primitive
 * that does not host-bind its root"). Either way the manifest's `root` slot
 * still needs a display utility below: an unknown element's UA-default
 * display is `inline` -- a box that a width/height utility cannot size, and
 * `arena-theme-toggle`'s own manifest keeps one too even though its root
 * lands on a real `<button>`, so the check stays uniform across every
 * primitive rather than special-casing the one exception. Skeleton's
 * `block arena-shimmer` fix (Skeleton.manifest.json) exists
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

/* The primitives that have no manifest at all, named rather than inferred --
 * the same discipline check-dimension-literals.mjs applies to its EXEMPT map,
 * and for the same reason: a guard that silently skips whatever it cannot find
 * stops being a guard the first time someone forgets a manifest.
 *
 * The hand-written SVG charts are the plan's one declared exception to the
 * manifest/recipe shape. A chart's visual identity is path data and
 * presentation attributes, and a class string cannot hold either, so there is
 * no `slots.root` for the loop above to read. They are NOT exempt from the
 * claim that guard makes -- an `<arena-bar-chart>` is exactly as much an
 * unknown, UA-default-inline element as an `<arena-tag>`, and a chart whose
 * host collapses to an inline box measures the wrong width and lays every bar
 * out against it. They prove it a different way: a static `display` in their
 * own host metadata, which the render test below asserts against a real DOM.
 * An inline `style` attribute is not wrapped in `@layer`, so happy-dom's CSS
 * engine does evaluate it -- the limitation described above does not apply. */
const NO_MANIFEST = new Set(['bar-chart', 'line-chart', 'doughnut-chart']);

test('every Angular primitive\'s root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  const primitivesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'primitives');
  const manifestsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tailwind', 'components');
  const names = readdirSync(primitivesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.ok(names.length > 0, 'no primitive directories found -- the guard would silently check nothing');

  for (const excluded of NO_MANIFEST) {
    assert.ok(names.includes(excluded), `NO_MANIFEST names "${excluded}", which is not a primitive directory -- stale entry`);
    const excludedManifestPath = join(manifestsDir, `${kebabToPascal(excluded)}.manifest.json`);
    assert.ok(
      !existsSync(excludedManifestPath),
      `NO_MANIFEST names "${excluded}", but ${excludedManifestPath} now exists -- the exclusion is stale and should be removed so this primitive is checked like every other one`,
    );
  }

  for (const name of names) {
    if (NO_MANIFEST.has(name)) continue;
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

/* The three tests below are the manifest guard's counterpart for a primitive
 * that has no manifest to guard. They render with DEFAULT inputs only -- no
 * `[values]` binding and no literal attribute, both of which this harness
 * silently drops (see the header) -- so everything asserted here is reachable
 * without ever driving a signal input. The geometry that does need inputs is
 * asserted as plain functions in bar-chart-geometry.test.ts instead. */

test('arena-bar-chart: the host is a block-level box, so the width it measures is a real content width', async () => {
  const fixture = TestBed.createComponent(BarChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bar-chart') as HTMLElement;
  // `containerWidth()` observes this element. An unknown element defaults to
  // display:inline, and a non-replaced inline box has no meaningful content
  // width for a ResizeObserver to report -- every bar would be laid out against
  // the wrong number. Both reads are asserted: the inline style attribute the
  // component declares, and what the CSS engine resolves it to.
  assert.equal(host.style.display, 'block', `host declared display "${host.style.display}"`);
  assert.equal(getComputedStyle(host).display, 'block');
  // The tooltip is absolutely positioned against this host, so it must also be
  // the containing block rather than inheriting one from an ancestor.
  assert.equal(host.style.position, 'relative');
});

test('arena-bar-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = TestBed.createComponent(BarChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const table = fixture.nativeElement.querySelector('arena-bar-chart table') as HTMLElement;
  assert.ok(table, 'the visually-hidden numbers table did not render');
  // `[attr.style]="SR_ONLY"` would set the literal string "[object Object]" and
  // apply nothing, leaving the table visible on the page. `[style]` takes the
  // object, which is what chart-internals.ts documents.
  assert.ok(!(table.getAttribute('style') ?? '').includes('[object Object]'),
    `the style object was stringified: "${table.getAttribute('style')}"`);
  assert.equal(table.style.position, 'absolute');
  assert.equal(table.style.width, '1px');
  assert.equal(table.style.height, '1px');
  assert.equal(table.style.margin, '-1px');
  // SR_ONLY's `clip` is deliberately not asserted here: happy-dom's
  // CSSStyleDeclaration does not expose the deprecated `clip` property, so it
  // reads back as '' whether or not it was applied. chart-internals.test.ts
  // asserts the constant itself carries it.
});

test('arena-bar-chart: the SVG presentation styles reach the DOM as tokens, not as literals', async () => {
  const fixture = TestBed.createComponent(BarChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  // The charts are the layer's declared styling exception, so this is the one
  // place a token has to survive a camelCase style object, Angular's style
  // normalization, and an SVG element to land as a real CSS declaration.
  // Grid lines render with default inputs (ticks always yields five), so this
  // needs no signal input to be reachable.
  const line = fixture.nativeElement.querySelector('arena-bar-chart line') as SVGElement;
  assert.equal(line.style.strokeWidth, 'var(--bw)');
  assert.equal(line.getAttribute('style'), 'stroke-width: var(--bw);');
  const text = fixture.nativeElement.querySelector('arena-bar-chart text') as SVGElement;
  assert.equal(text.getAttribute('style'), 'font-size: var(--dz-text-2xs);');
});

test('arena-bar-chart: the picture carries an accessible name and the numbers carry a caption', async () => {
  const fixture = TestBed.createComponent(BarChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const svg = fixture.nativeElement.querySelector('arena-bar-chart svg') as SVGElement;
  assert.equal(svg.getAttribute('role'), 'img');
  // No seriesLabel is set, so this is the fallback name -- a role="img" with no
  // name announces as an unlabeled graphic.
  assert.equal(svg.getAttribute('aria-label'), 'Bar chart');
  const caption = fixture.nativeElement.querySelector('arena-bar-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Bar chart');
});

/* The same four assertions, ported to the second hand-written chart. They render
 * with DEFAULT inputs only, for the reason the bar-chart block above states: an
 * empty `values` still draws the value axis (`ticks` always yields five) and still
 * renders the numbers table, so all of this is reachable without ever driving a
 * signal input. `line-chart-geometry.test.ts` carries the geometry that does need
 * inputs, as plain functions. */

test('arena-line-chart: the host is a block-level box, so the width it measures is a real content width', async () => {
  const fixture = TestBed.createComponent(LineChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-line-chart') as HTMLElement;
  // `containerWidth()` observes this element. An unknown element defaults to
  // display:inline, and a non-replaced inline box has no meaningful content width
  // for a ResizeObserver to report -- every point would be laid out against the
  // wrong number, and the crosshair would snap against a plot that is not there.
  assert.equal(host.style.display, 'block', `host declared display "${host.style.display}"`);
  assert.equal(getComputedStyle(host).display, 'block');
  // The tooltip is absolutely positioned against this host, so it must also be the
  // containing block rather than inheriting one from an ancestor.
  assert.equal(host.style.position, 'relative');
});

test('arena-line-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = TestBed.createComponent(LineChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const table = fixture.nativeElement.querySelector('arena-line-chart table') as HTMLElement;
  assert.ok(table, 'the visually-hidden numbers table did not render');
  // `[attr.style]="SR_ONLY"` -- which the task brief specified -- would set the
  // literal string "[object Object]" and apply nothing, leaving the table visible
  // under the chart. `[style]` takes the object, which is what chart-internals.ts
  // documents.
  assert.ok(!(table.getAttribute('style') ?? '').includes('[object Object]'),
    `the style object was stringified: "${table.getAttribute('style')}"`);
  assert.equal(table.style.position, 'absolute');
  assert.equal(table.style.width, '1px');
  assert.equal(table.style.height, '1px');
  assert.equal(table.style.margin, '-1px');
  // SR_ONLY's `clip` is deliberately not asserted here, for the reason the
  // bar-chart counterpart above records: happy-dom does not expose the deprecated
  // property, so it reads back as '' either way.
});

test('arena-line-chart: the SVG presentation styles reach the DOM as tokens, not as literals', async () => {
  const fixture = TestBed.createComponent(LineChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  // The brief wrote these as raw SVG attributes (`stroke-width="1"`,
  // `font-size="10"`), which check-dimension-literals.mjs cannot judge at all --
  // its attribute lookbehind excludes `-`, and `font-size` reduces to the
  // ungoverned `size`. So this is the assertion that the tokens are really here.
  const line = fixture.nativeElement.querySelector('arena-line-chart line') as SVGElement;
  assert.equal(line.style.strokeWidth, 'var(--bw)');
  assert.equal(line.getAttribute('style'), 'stroke-width: var(--bw);');
  const text = fixture.nativeElement.querySelector('arena-line-chart text') as SVGElement;
  assert.equal(text.getAttribute('style'), 'font-size: var(--dz-text-2xs);');
});

test('arena-line-chart: the picture carries an accessible name and the numbers carry a caption', async () => {
  const fixture = TestBed.createComponent(LineChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const svg = fixture.nativeElement.querySelector('arena-line-chart svg') as SVGElement;
  assert.equal(svg.getAttribute('role'), 'img');
  // No seriesLabel is set, so this is the fallback name -- a role="img" with no
  // name announces as an unlabeled graphic.
  assert.equal(svg.getAttribute('aria-label'), 'Line chart');
  const caption = fixture.nativeElement.querySelector('arena-line-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Line chart');
});

/* The third and last hand-written chart. Same shape as the two blocks above, with one
 * real difference in what is reachable: a bar chart and a line chart both draw a value
 * axis from `ticks()` regardless of their data, so a `<line>` and a `<text>` render with
 * default inputs and their token styles can be read off the real DOM. A doughnut has no
 * axis -- with the default empty `values` there is no slice and no centre label, and this
 * harness cannot drive `values` (see the header). So the `<path>`'s `strokeWidth:
 * 'var(--bw-strong)'` and the centre label's `fontSize: 'var(--dz-text-lg)'` are NOT
 * render-provable here, and nothing below pretends otherwise. What covers them instead:
 * `check:dimensions` reads both as themselves BECAUSE they are camelCase object keys
 * rather than the brief's `stroke-width="2"` / `font-size="16"` attributes, which that
 * gate cannot see at all (its attribute lookbehind excludes `-`, and `font-size` reduces
 * to the ungoverned `size`) -- confirmed by writing both raw literals into this component
 * and watching the gate stay green, then writing the same two values as object keys and
 * watching it fail. `check:angular` (`ngc --strictTemplates`) is the authority that the
 * `[style]` bindings themselves typecheck. The two style objects that DO render with no
 * data -- the SVG's own and the legend column's -- are asserted for real below, which is
 * what proves the object-to-DOM path works at all on this component. */

test('arena-doughnut-chart: the host is the flex row itself, so the box it measures is the box it lays out', async () => {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;
  // `containerWidth()` observes this element. The task brief wrapped the whole chart in
  // an inner flex `<div>`, which would have measured the host while laying out the
  // wrapper -- and an unknown element defaults to display:inline, a non-replaced box
  // with no content width for a ResizeObserver to report, so the ring would be sized
  // against the wrong number. The host carries the row instead.
  assert.equal(host.style.display, 'flex', `host declared display "${host.style.display}"`);
  assert.equal(getComputedStyle(host).display, 'flex');
  // The visually-hidden numbers table is absolutely positioned, so the host must be its
  // containing block rather than leaving it to escape to an ancestor.
  assert.equal(host.style.position, 'relative');
  // The row's own two properties: it fills its parent, and the gap between the ring and
  // the legend is the token derivation the plot width subtracts 16px for.
  assert.equal(host.style.width, '100%');
  assert.equal(host.style.gap, 'calc(var(--sp-1) * 4)');
});

test('arena-doughnut-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const table = fixture.nativeElement.querySelector('arena-doughnut-chart table') as HTMLElement;
  assert.ok(table, 'the visually-hidden numbers table did not render');
  // `[attr.style]="SR_ONLY"` -- which the task brief specified, as it did for both other
  // charts -- would set the literal string "[object Object]" and apply nothing, leaving
  // the table visible beside the legend. `[style]` takes the object, which is what
  // chart-internals.ts documents.
  assert.ok(!(table.getAttribute('style') ?? '').includes('[object Object]'),
    `the style object was stringified: "${table.getAttribute('style')}"`);
  assert.equal(table.style.position, 'absolute');
  assert.equal(table.style.width, '1px');
  assert.equal(table.style.height, '1px');
  assert.equal(table.style.margin, '-1px');
  // SR_ONLY's `clip` is deliberately not asserted here, for the reason the bar-chart
  // counterpart above records: happy-dom does not expose the deprecated property, so it
  // reads back as '' either way.
});

test('arena-doughnut-chart: the style objects that render without data reach the DOM as real declarations', async () => {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;
  // The ring's box must not be squeezed by the legend below the width its geometry was
  // computed against.
  const svg = host.querySelector('svg') as SVGElement;
  assert.equal(svg.style.display, 'block');
  assert.equal(svg.style.flexShrink, '0');
  // The legend column renders whether or not there is data in it, so its token gap is
  // the one token-valued declaration on this component a real render can read back.
  const legend = host.querySelector(':scope > div') as HTMLElement;
  assert.ok(legend, 'the legend column did not render');
  assert.equal(legend.style.gap, 'calc(var(--sp-1) * 1.5)');
  assert.equal(legend.style.flexDirection, 'column');
});

test('arena-doughnut-chart: the picture carries an accessible name and the numbers carry a caption', async () => {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const svg = fixture.nativeElement.querySelector('arena-doughnut-chart svg') as SVGElement;
  assert.equal(svg.getAttribute('role'), 'img');
  // Unlike the other two charts this name is static: a doughnut has no `seriesLabel`,
  // because its series ARE its slices and they are named by the legend. A role="img"
  // with no name announces as an unlabeled graphic.
  assert.equal(svg.getAttribute('aria-label'), 'Doughnut chart');
  const caption = fixture.nativeElement.querySelector('arena-doughnut-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Doughnut chart');
});

test('arena-doughnut-chart: with no data it draws no slice at all, rather than an empty ring', async () => {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;
  // `@if (segment.path)` is the gate: a zero-width slice yields '' and must not reach
  // the DOM as a `d=""` path. This is the empty case rendering for real, not a stand-in.
  assert.equal(host.querySelector('path'), null, 'an empty doughnut must paint no slice');
  assert.equal(host.querySelector('text'), null, 'the centre label must not render with nothing hovered');
  assert.equal(host.querySelectorAll('tbody tr').length, 0, 'the numbers table must have no rows');
});

after(() => {
  GlobalRegistrator.unregister();
});
