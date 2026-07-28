/* Pins the host-binding shape the reference primitives (avatar, tag) settled
 * on after review, and that every later primitive follows except
 * `arena-activity-feed`: the recipe's visible slot is bound onto the
 * component's own host element (`host: { '[class]': 'styles().root()' }`),
 * not onto a wrapper span one level inside it. In React, a component's root
 * element IS the flex item its parent row lays out; in Angular that flex
 * item is the host, so a `root` class such as `shrink-0` protects nothing
 * unless it lives there. Skeleton (below) is the one variation: its host
 * binds to whichever slot is actually visible for the current variant
 * (`root`, or `stack` when `variant="text"`), because `root` alone is
 * `hidden` in that case -- same principle, one more level of indirection.
 * `arena-activity-feed` is the one exception rather than a variation: its
 * root must be a real `<ul>` with real `<li>` rows, not a binding on the
 * host at all, because a native list structure cannot be an unknown custom
 * element (see components-divergences.md, "ActivityFeed is the Angular
 * primitive that does not host-bind its root").
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
import '@angular/compiler';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { useTestEnvironment } from './testbed-env';
import { ANGULAR_PRIMITIVES, LIB, TAILWIND_COMPONENTS } from './compliance';
import { ActivityFeed } from '../primitives/activity-feed/activity-feed';
import { activityFeedStyles } from '../primitives/activity-feed/activity-feed.variants';
import { AppLogo } from '../primitives/app-logo/app-logo';
import { appLogoStyles } from '../primitives/app-logo/app-logo.variants';
import { Avatar } from '../primitives/avatar/avatar';
import { avatarStyles } from '../primitives/avatar/avatar.variants';
import { BarChart } from '../primitives/bar-chart/bar-chart';
import { Breadcrumbs } from '../primitives/breadcrumbs/breadcrumbs';
import type { Crumb } from '../api.generated';
import { breadcrumbsStyles } from '../primitives/breadcrumbs/breadcrumbs.variants';
import { BulkActionBar } from '../primitives/bulk-action-bar/bulk-action-bar';
import type { BulkAction } from '../api.generated';
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
import type { StatDelta } from '../api.generated';
import { Tag } from '../primitives/tag/tag';
import { tagStyles } from '../primitives/tag/tag.variants';
import { UnauthCard } from '../primitives/unauth-card/unauth-card';
import { unauthCardStyles } from '../primitives/unauth-card/unauth-card.variants';

/* The TestBed environment may be initialised only ONCE per process: bun runs
 * every test file in one process, and Angular's TestBed throws ("Cannot set
 * base providers because it has already been called") the second time it is
 * called across files that ran together. This file used to own that call
 * outright, which is why Skeleton's host-binding coverage lives here beside
 * Tag's and Avatar's rather than in a file of its own. It now goes through
 * `useTestEnvironment()` (testbed-env.ts), which claims the one TestBed
 * environment the whole directory shares -- a plain `if (claimed) return`
 * guard, not a reset -- so a later suite needing a real render no longer has
 * to be appended to this one; see that file for why a reset was tried and
 * measurably does not work (`resetTestEnvironment()` leaves the process-wide
 * DOM adapter pointing at whichever document was live at first initialisation).
 *
 * Inputs are driven two ways here, and the choice is mechanical rather than a
 * matter of taste. Where a host component wraps the child, the host's own plain
 * field is assigned and its template binds that field to the child's input --
 * ordinary Angular, since a host in this file is a component the suite owns.
 * Where a suite constructs the primitive directly with no wrapper,
 * `fixture.componentRef.setInput()` drives it. A static literal attribute
 * satisfies a string input as well, which two tests below assert directly.
 *
 * Skeleton's coverage here stops at the default variant, and that is a scope
 * decision rather than a limitation: skeleton-variants.test.ts covers every
 * variant's class output against the plain-TypeScript recipe, and
 * skeleton-dimensions.test.ts renders all four for real. */
useTestEnvironment();

/* `name` is `input.required<string>()` (Resolution D of task 24's brief: nothing
 * defaults, on purpose -- an empty lock-up would ship no one's mark by omission,
 * so there is no fallback value to fall back to), and the static literal
 * `name="Draven"` satisfies it: a string input takes a static attribute during
 * the template's creation pass, before any change detection runs. Two tests
 * below use this host -- one asserting that the attribute both reaches the input
 * and stays on the element, the other reading the projected mark back.
 *
 * The projected `<span mark>mark</span>` carries the `mark` ATTRIBUTE
 * `<ng-content select="[mark]" />` actually selects on -- a bare
 * `<span>mark</span>` with no such attribute matches no selector at all (this
 * component's template has no catch-all `<ng-content>` for it to fall back
 * to) and projects nowhere, which this host used to do silently. */
@Component({
  standalone: true,
  imports: [AppLogo],
  template: `<arena-app-logo name="Draven" class="consumer-class"><span mark>mark</span></arena-app-logo>`,
})
class AppLogoStaticAttributeHost {}

/* `name="Juan Carlos"` below is a real value for `arena-avatar`'s `name` input,
 * not decoration: a static attribute satisfies a string input. Nothing below
 * asserts on it -- only the class merge is -- so it is the initials source the
 * component would render from rather than a claim this file makes. */
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
  template: `<arena-breadcrumbs class="consumer-class" [items]="items" />`,
})
class BreadcrumbsHost {
  items: Crumb[] = [];
}

/* `items` is `input.required<Crumb[]>()`, satisfied by `BreadcrumbsHost`'s own
 * `[items]="items"` binding. Assigning the host's plain field before the first
 * `detectChanges()` is what the binding then carries into the child. */
function createBreadcrumbsHost(items: Crumb[] = []) {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.componentInstance.items = items;
  return fixture;
}

/* `label` and `value` are `input.required<string>()` (`api/components/StatCard.json`),
 * and the static literals below satisfy both. This host is the second of the two
 * static-attribute proofs in this file, mirroring `AppLogoStaticAttributeHost`. */
@Component({
  standalone: true,
  imports: [StatCard],
  template: `<arena-stat-card class="consumer-class" label="Revenue" value="$48.2k" />`,
})
class StatCardHost {}

/* `renderStatCard` constructs the real `StatCard` directly, with no host wrapper,
 * and drives every input through `setInput()`. With no wrapper there is no
 * template to carry a consumer's `class="..."`, so the tests below add the token
 * with `classList.add` before the first `detectChanges()` instead, exactly as
 * `renderAppLogo`'s own second test does. */
function renderStatCard(label: string, value: string, delta?: StatDelta, icon?: string) {
  const fixture = TestBed.createComponent(StatCard);
  fixture.componentRef.setInput('label', label);
  fixture.componentRef.setInput('value', value);
  if (delta !== undefined) fixture.componentRef.setInput('delta', delta);
  if (icon !== undefined) fixture.componentRef.setInput('icon', icon);
  return fixture;
}

/* This test's premise inverted when the suites moved from the JIT harness to the
 * ngc emit. It used to pin the opposite claim -- that a static literal attribute
 * landed on the element and never reached the signal input, so `detectChanges()`
 * could never be called on this host without `label()` throwing NG0950. Compiled
 * by ngtsc the attribute is a real input assignment, made during the template's
 * creation pass, and the required inputs are satisfied without a single binding.
 * Both halves are asserted, because they are separate facts: the value reaches
 * the input (the render carries it) AND the attribute is still in the DOM, which
 * is the part a reader is most likely to assume an input assignment consumes. */
test('arena-stat-card: a static "label"/"value" attribute satisfies the required string input and stays on the element', () => {
  const fixture = TestBed.createComponent(StatCardHost);
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector('arena-stat-card') as HTMLElement;
  assert.equal(host.getAttribute('label'), 'Revenue', 'the literal attribute should still land on the host element itself');
  assert.equal(host.getAttribute('value'), '$48.2k', 'sanity: the second literal attribute lands the same way');
  assert.ok(host.classList.contains('consumer-class'), `sanity: the static class attribute survives the host [class] binding: "${host.className}"`);
  const labelClass = statCardStyles().label().split(/\s+/)[0];
  const valueClass = statCardStyles().value().split(/\s+/)[0];
  assert.equal(host.querySelector(`.${labelClass}`)?.textContent, 'Revenue', 'the attribute must reach the label input, not only the DOM');
  assert.equal(host.querySelector(`.${valueClass}`)?.textContent, '$48.2k', 'the attribute must reach the value input, not only the DOM');
  fixture.destroy();
});

@Component({
  standalone: true,
  imports: [BulkActionBar],
  host: { 'data-host': 'bulk-action-bar' },
  template: `<arena-bulk-action-bar class="consumer-class" [count]="count" [actions]="actions" />`,
})
class BulkActionBarHost {
  count = 0;
  actions: BulkAction[] = [];
}

/* `count` and `actions` are `input.required<number>()` /
 * `input.required<BulkAction[]>()` (`api/components/BulkActionBar.json`),
 * satisfied by `BulkActionBarHost`'s own two bindings. Its fields hold `0` and
 * `[]` -- the same values `input(0)`/`input([])` used to default to -- so every
 * assertion below keeps proving what it proved before. */
function createBulkActionBarHost() {
  return TestBed.createComponent(BulkActionBarHost);
}

@Component({
  standalone: true,
  imports: [ChartCard],
  host: { 'data-host': 'chart-card' },
  template: `<arena-chart-card class="consumer-class" />`,
})
class ChartCardHost {}

/* The literal `title="Something went wrong"` is the same string `error-state.ts`
 * defaults `title` to, so the rendered title reads the same whether the attribute
 * is supplied or not; nothing below asserts on it, only on classes, `role="alert"`
 * and the actions wrapper.
 *
 * `retryLabel` is bound from a field rather than written as a literal because the
 * two tests using this host want opposite values: absent, so the actions wrapper
 * stays away, and set, so the retry button renders. An unset field binds
 * `undefined`, which is exactly what supplying no attribute would give. */
@Component({
  standalone: true,
  imports: [ErrorState],
  template: `<arena-error-state class="consumer-class" title="Something went wrong" [retryLabel]="retryLabel" />`,
})
class ErrorStateWithoutActionHost {
  retryLabel: string | undefined;
}

@Component({
  standalone: true,
  imports: [PageHead],
  host: { 'data-host': 'page-head' },
  template: `<arena-page-head class="consumer-class" [title]="title" />`,
})
class PageHeadWithoutActionsHost {
  title = '';
}

/* `title` is `input.required<string>()` (`api/components/PageHead.json`),
 * satisfied by `PageHeadWithoutActionsHost`'s own `[title]="title"` binding.
 * The title text itself is irrelevant to every assertion below -- only the
 * class/DOM shape is checked -- so any non-empty string will do. */
function createPageHeadWithoutActionsFixture() {
  const fixture = TestBed.createComponent(PageHeadWithoutActionsHost);
  fixture.componentInstance.title = 'Portal';
  return fixture;
}

@Component({
  standalone: true,
  imports: [UnauthCard],
  host: { 'data-host': 'unauth-card' },
  template: `<arena-unauth-card class="consumer-class" />`,
})
class UnauthCardWithoutProjectionHost {}

@Component({
  standalone: true,
  imports: [BarChart],
  host: { 'data-host': 'bar-chart' },
  template: `<arena-bar-chart [labels]="labels" [values]="values" />`,
})
class BarChartHost {
  labels: string[] = [];
  values: number[] = [];
}

/* `arena-bar-chart`'s required `labels`/`values` come from `BarChartHost`'s own
 * two bindings. Its fields are deliberately EMPTY arrays: these four tests
 * assert host box, style-object binding and the fallback accessible name, all
 * of which render with no data at all (`ticks` always yields five grid lines),
 * so driving real data here would test something else. */
function createBarChartHost() {
  const fixture = TestBed.createComponent(BarChartHost);
  fixture.detectChanges();
  return fixture;
}

@Component({
  standalone: true,
  imports: [LineChart],
  host: { 'data-host': 'line-chart' },
  template: `<arena-line-chart [labels]="labels" [values]="values" />`,
})
class LineChartHost {
  labels: string[] = [];
  values: number[] = [];
}

/* `arena-line-chart`'s required `labels`/`values`, bound the same way
 * createBarChartHost() binds the bar chart's. Empty arrays on purpose: these
 * four tests assert host box, style-object binding and the fallback accessible
 * name, none of which needs data. */
function createLineChartHost() {
  const fixture = TestBed.createComponent(LineChartHost);
  fixture.detectChanges();
  return fixture;
}

@Component({
  standalone: true,
  imports: [DoughnutChart],
  host: { 'data-host': 'doughnut-chart' },
  template: `<arena-doughnut-chart [labels]="labels" [values]="values" />`,
})
class DoughnutChartHost {
  labels: string[] = [];
  values: number[] = [];
}

/* `arena-doughnut-chart`'s required `labels`/`values`, bound the same way
 * createBarChartHost() binds the bar chart's. Empty arrays on purpose: four of
 * these five tests assert host box, style-object binding and the fallback
 * accessible name, and the fifth asserts that NO data draws NO slice, which
 * needs the empty array to be a real bound value rather than an untouched
 * default. */
function createDoughnutChartHost() {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  return fixture;
}

/* `AppLogo` is constructed directly here, with no host wrapper, so the fixture's
 * root IS the component and `name`/`dim` are driven through `setInput()`. The
 * wrapper is skipped rather than merely unnecessary: the second test below adds
 * a class token straight onto the host element before the first
 * `detectChanges()`, which is how it proves the host `[class]` binding merges
 * rather than assigns. */
function renderAppLogo(name: string, dim?: string) {
  const fixture = TestBed.createComponent(AppLogo);
  fixture.componentRef.setInput('name', name);
  if (dim !== undefined) fixture.componentRef.setInput('dim', dim);
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
 * React's JSX. This is that verification: a real `AppLogo` instance, its real
 * ngtsc-compiled template, a real DOM. */
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

/* This test's premise inverted when the suites moved from the JIT harness to
 * the ngc emit; `StatCardHost`'s counterpart further up inverted with it. It
 * used to pin that a static literal `name="Draven"` landed on
 * `<arena-app-logo>` as a stray DOM attribute and never reached the required
 * `name` input, so `detectChanges()` could not be called here at all without
 * NG0950. Compiled by ngtsc it does reach the input, assigned during the
 * template's creation pass, and BOTH facts are asserted: the attribute is
 * still on the element, and the value it carried is the one the wordmark
 * renders.
 *
 * `name` colliding with a real global HTML attribute is the reason the second
 * half is worth pinning rather than assuming. An input assignment does not
 * consume the attribute, so the element carries both -- a component reading
 * `getAttribute('name')` instead of `name()` would read the same string today
 * and a different one the moment a caller used a binding.
 *
 * `fixture.destroy()` runs at the end because TestBed attaches every created
 * fixture to the shared `ApplicationRef`, and a later test's own
 * `detectChanges()` walks every still-attached view -- zoneless change
 * detection has no per-component isolation, and this directory shares one
 * document for its whole run. */
test('arena-app-logo: a static "name" attribute satisfies the required input AND stays on the element', () => {
  const fixture = TestBed.createComponent(AppLogoStaticAttributeHost);
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector('arena-app-logo') as HTMLElement;
  assert.equal(host.getAttribute('name'), 'Draven', 'the literal attribute should still land on the host element itself');
  assert.ok(host.classList.contains('consumer-class'), `sanity: the static class attribute survives the host [class] binding: "${host.className}"`);
  const nameClass = appLogoStyles().name().split(/\s+/)[0];
  assert.equal(
    (host.querySelector(`.${nameClass}`) as HTMLElement | null)?.textContent,
    'Draven',
    'the attribute must reach the name input, not merely sit on the element',
  );
  fixture.destroy();
});

/* Real coverage of `mark` content projection: the projected `<span mark>mark</span>`
 * must land inside the component's own mark slot, not merely exist somewhere in the
 * host's light DOM. */
test('arena-app-logo: content selected for [mark] projects into the mark slot', () => {
  const fixture = TestBed.createComponent(AppLogoStaticAttributeHost);
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector('arena-app-logo') as HTMLElement;
  const markClass = appLogoStyles().mark().split(/\s+/)[0];
  const markSlot = host.querySelector(`.${markClass}`);
  assert.ok(markSlot, 'the mark slot element itself is missing');
  assert.equal(markSlot?.querySelector('span')?.textContent, 'mark', 'the projected <span mark> should render inside the mark slot');
  fixture.destroy();
});

/* `arena-activity-feed` is the one primitive in this file whose styled root is
 * NOT host-bound -- its root must be a real `<ul>` so its rows can be real
 * `<li>`s, and `<arena-activity-feed>` cannot itself become one
 * (components-divergences.md, "ActivityFeed is the Angular primitive that
 * does not host-bind its root"). `items` is driven through `setInput()` on the
 * directly-created fixture, the same shape `renderAppLogo` above uses. */
function renderActivityFeed(items: unknown[]) {
  const fixture = TestBed.createComponent(ActivityFeed);
  fixture.componentRef.setInput('items', items);
  return fixture;
}

test('arena-activity-feed: the host stays bare and unstyled -- the recipe classes land on the real <ul> inside it, not the host', () => {
  const fixture = renderActivityFeed([]);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  assert.equal(host.className, '', 'the host must carry no recipe classes of its own -- root is not host-bound here');
  const ul = host.querySelector('ul') as HTMLElement;
  assert.ok(ul, 'the root must be a real <ul>');
  for (const cls of activityFeedStyles().root().split(/\s+/))
    assert.ok(ul.classList.contains(cls), `the <ul> is missing root class "${cls}"`);
  fixture.destroy();
});

/* Regression coverage for Resolution D of task 25's brief: the first row
 * must render with no top divider and every later row must carry one, proved
 * against the real rendered <li> elements rather than only against the pure
 * `resolveActivityFeedRows` function `activity-feed-variants.test.ts`
 * already covers -- this is the template's own `@for`/`track` wiring that
 * pure function has no way to exercise. */
test('arena-activity-feed: the first <li> carries no divider and every later one does, in a real render', () => {
  const fixture = renderActivityFeed([
    { id: '1', actor: 'Marta', action: 'deployed', tone: 'success' },
    { id: '2', actor: 'Ivan', action: 'opened an incident', tone: 'danger' },
    { id: '3', actor: 'Rae', action: 'approved the rollback' },
  ]);
  fixture.detectChanges();
  const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li'));
  assert.equal(rows.length, 3);
  const dividerClass = 'border-t-[length:var(--bw)]';
  assert.ok(!rows[0].className.includes(dividerClass), `the first <li> must not carry the divider: "${rows[0].className}"`);
  for (const row of rows.slice(1))
    assert.ok(row.className.includes(dividerClass), `every <li> after the first must carry the divider: "${row.className}"`);
  fixture.destroy();
});

/* React's `ActivityFeed.jsx` writes `{item.target && ' '}` before its target
 * span specifically to insert a space JSX would not otherwise add. Angular's
 * whitespace handling is a different platform contract (this file's own
 * `AppLogo` block above proves it collapses runs of source whitespace
 * between inline nodes rather than inserting where the source has none) --
 * not safe to assume carries the same result without a real render. This
 * proves it does: a real actor/action/target composition reads with exactly
 * one space between each part, not zero (a missing gap) and not two (a
 * collapsed-but-not-removed source newline stacking on React's literal
 * space, which does not apply here since there is no such literal in the
 * Angular template -- but worth proving rather than assuming). */
test('arena-activity-feed: actor, action and target compose with exactly one space between them, and time is absent when unset', () => {
  const fixture = renderActivityFeed([
    { id: '1', actor: 'Marta', action: 'deployed', target: 'billing@2.4.1' },
  ]);
  fixture.detectChanges();
  const li = (fixture.nativeElement as HTMLElement).querySelector('li') as HTMLElement;
  // Document order: [0] the dot span (empty), [1] the `text` slot span (wraps
  // the actor <b> and, nested inside it, the target span) -- the target span
  // is itself among these three, since querySelectorAll walks descendants.
  const spans = li.querySelectorAll('span');
  const text = spans[1] as HTMLElement;
  assert.equal(
    text.textContent?.replace(/\s+/g, ' ').trim(),
    'Marta deployed billing@2.4.1',
    `expected "Marta deployed billing@2.4.1" with single spaces, got ${JSON.stringify(text.textContent)}`,
  );
  assert.equal(spans.length, 3, 'dot, text and target spans only -- no time span when time is unset');
  fixture.destroy();
});

test('arena-activity-feed: an item with neither target nor time renders only the dot and the actor/action text', () => {
  const fixture = renderActivityFeed([{ id: '1', actor: 'Rae', action: 'approved the rollback' }]);
  fixture.detectChanges();
  const li = (fixture.nativeElement as HTMLElement).querySelector('li') as HTMLElement;
  assert.equal(li.querySelectorAll('span').length, 2, 'dot and text spans only -- no target, no time');
  const text = li.querySelectorAll('span')[1] as HTMLElement;
  assert.equal(text.textContent?.replace(/\s+/g, ' ').trim(), 'Rae approved the rollback');
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
  const fixture = createBreadcrumbsHost();
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-breadcrumbs') as HTMLElement;
  for (const cls of breadcrumbsStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  fixture.destroy();
});

test('arena-breadcrumbs: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = createBreadcrumbsHost();
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-breadcrumbs') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
  fixture.destroy();
});

test('arena-breadcrumbs: the host itself carries the nav landmark, not a wrapper inside it', async () => {
  const fixture = createBreadcrumbsHost();
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-breadcrumbs') as HTMLElement;
  assert.equal(host.getAttribute('role'), 'navigation');
  assert.equal(host.getAttribute('aria-label'), 'Breadcrumb');
  assert.equal(host.children.length, 0, 'with no items, the trail renders no crumbs of its own');
  fixture.destroy();
});

/* `navigate` carries the clicked `Crumb` alone -- the API contract
 * (`api/components/Breadcrumbs.json`) deliberately does not forward the
 * native `MouseEvent`, so a listener can no longer call `preventDefault()`
 * to substitute SPA routing; the anchor's own navigation always fires
 * alongside the emission (ctrl-click, middle-click and open-in-new-tab keep
 * working, which is the point). This is a real capability loss from the
 * previous `ArenaCrumbNavigateEvent { crumb, event }` shape, recorded in
 * both `breadcrumbs.prompt.md` and the class doc comment, not something
 * this test can restore.
 *
 * The template wires `(click)="onCrumbClick(crumb)"`. This test does not
 * dispatch a click -- it renders through `createBreadcrumbsHost`, then calls
 * `onCrumbClick` directly with a real `Crumb` and asserts `navigate` emits
 * that crumb alone. What that buys is that `onCrumbClick` is the exact method
 * the template's `(click)` binds to, not a stand-in; the emit is what proves
 * the binding itself compiles against the component's real members. */
test('arena-breadcrumbs: a crumb click emits the clicked Crumb alone through navigate', async () => {
  const fixture = createBreadcrumbsHost();
  fixture.detectChanges();
  await fixture.whenStable();
  const breadcrumbs = fixture.debugElement.query(By.directive(Breadcrumbs)).componentInstance as Breadcrumbs;

  let received: Crumb | undefined;
  breadcrumbs.navigate.subscribe((payload) => {
    received = payload;
  });

  const crumb: Crumb = { label: 'Clients', href: '/clients' };
  (breadcrumbs as unknown as { onCrumbClick(crumb: Crumb): void }).onCrumbClick(crumb);

  assert.ok(received, 'navigate did not emit');
  assert.equal(received, crumb, 'the emitted payload is not the same crumb object the click targeted');
  fixture.destroy();
});

test('arena-stat-card: the root recipe classes land on the host element itself', () => {
  const fixture = renderStatCard('Revenue', '$48.2k');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  for (const cls of statCardStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  fixture.destroy();
});

test('arena-stat-card: a class already on the host before the first detectChanges survives the [class] host binding', () => {
  const fixture = renderStatCard('Revenue', '$48.2k');
  (fixture.nativeElement as HTMLElement).classList.add('consumer-class');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the pre-existing class: "${host.className}"`);
  for (const cls of statCardStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  fixture.destroy();
});

/* Real coverage of the pill's gate, now that both layers read the same
 * contract member: `delta()?.value` truthy renders the pill, matching React's
 * `delta?.value && (...)` exactly (Task 7's fix for React's old empty-pill
 * behaviour). Reachable here because `renderStatCard` drives `delta` through
 * `setInput()`, the same way it drives label and value. */
test('arena-stat-card: a delta with a value renders the pill; a delta with a tone but no value renders nothing', () => {
  const withValue = renderStatCard('Deploys', '128', { value: '+12%', direction: 'up', tone: 'positive' });
  withValue.detectChanges();
  const deltaClass = statCardStyles().delta().split(/\s+/)[0];
  assert.ok((withValue.nativeElement as HTMLElement).querySelector(`.${deltaClass}`), 'a delta with a value must render the pill');
  withValue.destroy();

  const emptyValue = renderStatCard('Deploys', '128', { value: '', direction: 'up', tone: 'positive' });
  emptyValue.detectChanges();
  assert.equal(
    (emptyValue.nativeElement as HTMLElement).querySelector(`.${deltaClass}`),
    null,
    'a delta with a tone/direction but an empty value must render no pill at all',
  );
  emptyValue.destroy();
});

/* Real coverage of `icon` as a Phosphor class name (`api/components/StatCard.json`,
 * per the "Conventions the audits settled" section of `api/README.md`), replacing the
 * old slot-projection test: `icon` gates the wrapper on `@if (icon(); as glyph)`, so
 * an unfilled icon must render no wrapper at all rather than an empty one. */
test('arena-stat-card: an icon class name renders the <i> inside the aria-hidden wrapper', () => {
  const fixture = renderStatCard('Deploys', '128', undefined, 'ph-bold ph-rocket');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const iconClass = statCardStyles().icon().split(/\s+/)[0];
  const iconSlot = host.querySelector(`.${iconClass}`);
  assert.ok(iconSlot, 'the icon wrapper element itself is missing');
  assert.equal(iconSlot?.getAttribute('aria-hidden'), 'true', 'the wrapper must stay aria-hidden');
  assert.ok(iconSlot?.querySelector('i.ph-bold.ph-rocket'), 'the glyph <i> must carry the icon class name');
  fixture.destroy();
});

test('arena-stat-card: no icon renders no wrapper at all -- not an empty one', () => {
  const fixture = renderStatCard('Deploys', '128');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const iconClass = statCardStyles().icon().split(/\s+/)[0];
  assert.equal(host.querySelector(`.${iconClass}`), null, 'no icon means no icon wrapper at all');
  fixture.destroy();
});

/* BulkActionBar's whole presence is driven by `count` alone (React's
 * `BulkActionBar.jsx` returns `null` at zero) -- following ConfirmDialog's
 * resolution for the same shape, the host stays permanently in the DOM and a
 * `open` variant toggles `hidden`, rather than wrapping the host itself in
 * an `@if`. `count` is required as of the API contract, so
 * `createBulkActionBarHost()` sets it to `0` explicitly rather than relying
 * on a default -- the same value `input(0)` used to supply -- and
 * `bulkActionBarStyles()`'s own zero-count output already includes `hidden`.
 * This is real coverage, not a stand-in, of a real TestBed render landing
 * that state on the actual host. */
test('arena-bulk-action-bar: the root recipe classes land on the host element itself, hidden when count is 0', async () => {
  const fixture = createBulkActionBarHost();
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bulk-action-bar') as HTMLElement;
  for (const cls of bulkActionBarStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  assert.ok(host.classList.contains('hidden'), 'a bar with no selection (count 0) must render hidden');
});

test('arena-bulk-action-bar: a consumer-supplied class on the host survives the [class] binding', async () => {
  const fixture = createBulkActionBarHost();
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bulk-action-bar') as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

test('arena-bulk-action-bar: the host renders no children while count is 0 -- nothing focusable exists behind the hidden bar', async () => {
  const fixture = createBulkActionBarHost();
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

/* The bare case, and the bare case only: `ChartCardHost` supplies no `title`
 * and projects nothing into `[actions]` or the default slot, so both halves of
 * `@if (title() || actions())` are false. That is what is asserted -- the whole
 * head row, not just the actions wrapper inside it, must be absent, matching
 * React's `{(title || actions) && (...)}` gate rather than the task brief's
 * unconditional `head`.
 *
 * The positive half is simply not covered by this file; nothing here claims it
 * is unreachable. */
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
 * standing in for the `[action]` CSS selector `ng-content select`
 * already used, because Angular content queries do not accept a CSS
 * selector as a locator (only a directive/component type, a template
 * reference variable, or a DI token -- confirmed against the Angular docs
 * before writing this).
 *
 * Only the negative case is covered below, and covering it is the point: it is
 * the reported bug's exact repro -- an empty state with no action must not ship
 * the wrapper's dead space -- so with nothing projected, `action()` is
 * `undefined` and the wrapper must be absent from the DOM entirely. Whether the
 * positive case could now be rendered here is untested; no test in this file
 * projects into `[action]`.
 *
 * `title` is `input.required<string>()` (`api/components/EmptyState.json`),
 * driven through `setInput()` on a directly-created fixture -- `EmptyState`
 * itself is the fixture's root, so there is no host wrapper here. */
function renderEmptyState(title: string) {
  const fixture = TestBed.createComponent(EmptyState);
  fixture.componentRef.setInput('title', title);
  return fixture;
}

test('arena-empty-state: the action wrapper is absent from the DOM when no [action] content is projected', () => {
  const fixture = renderEmptyState('No projects yet');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  assert.equal(host.querySelector('button'), null, 'no action was projected, so no action markup should exist at all');
  const actionClass = emptyStateStyles().action().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`:scope > .${actionClass}`),
    null,
    'the action wrapper div must not render when the action slot is empty',
  );
  fixture.destroy();
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

/* Under the contract (`api/components/ErrorState.json`, Reshape A) Arena draws its own
 * retry `<button>` from `retryLabel`/`retry`; the projected `[secondaryAction]` slot
 * (`ArenaSecondaryAction`) is only for what a consumer adds beside it. The actions
 * wrapper is now gated on `retryLabel() || secondaryAction()` rather than a single
 * projected `[action]`. The `secondaryAction()` half of that gate is not exercised by
 * any test in this file -- nothing here projects into `[secondaryAction]`.
 * `ErrorStateWithoutActionHost` supplies neither `retryLabel` nor a projected
 * `[secondaryAction]`, so the wrapper stays absent -- this is the negative case, real
 * coverage of the same reported bug's exact repro, ported to `arena-error-state`'s own
 * actions slot. The positive half of `retryLabel` -- a signal input, not a content query
 * -- IS directly provable, and the test below does exactly that. */
test('arena-error-state: the actions wrapper is absent from the DOM when neither retryLabel nor [secondaryAction] content is projected', async () => {
  const fixture = TestBed.createComponent(ErrorStateWithoutActionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-error-state') as HTMLElement;
  assert.equal(host.querySelector('button'), null, 'neither retryLabel nor a secondary action was supplied, so no action markup should exist at all');
  const actionsClass = errorStateStyles().actions().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`:scope > .${actionsClass}`),
    null,
    'the actions wrapper div must not render when both retryLabel and secondaryAction are absent',
  );
});

/* Arena draws the retry button itself now -- the positive proof that a `retryLabel`
 * signal input renders a real `<button>` carrying the manifest's `retry` slot classes.
 * The host's own field is assigned before the first `detectChanges()`, so the
 * template's first read of `retryLabel()` already sees it. */
function createErrorStateWithRetryFixture() {
  const fixture = TestBed.createComponent(ErrorStateWithoutActionHost);
  fixture.componentInstance.retryLabel = 'Retry';
  return fixture;
}

test('arena-error-state: retryLabel draws a real retry button carrying the manifest\'s retry slot classes', async () => {
  const fixture = createErrorStateWithRetryFixture();
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-error-state') as HTMLElement;
  const button = host.querySelector('button');
  assert.notEqual(button, null, 'retryLabel was supplied, so a retry button must render');
  assert.equal(button!.textContent, 'Retry');
  const retryClass = errorStateStyles().retry().split(/\s+/)[0];
  assert.ok(button!.classList.contains(retryClass), `retry button is missing recipe class "${retryClass}"`);
  fixture.destroy();
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
 * poison the module-level cache this file depends on, in either file order --
 * that split is about `container-size.ts`'s own cache, keyed per breakpoint
 * name, so it holds regardless of file order or of the document being shared;
 * it is unaffected by whether `--bp-sm` itself is cleared off the real
 * document afterward.) Each test below clears `--bp-sm` in a `finally`: this
 * directory now shares one real document for its whole run (testbed-env.ts),
 * so a property left on `documentElement` would otherwise outlive this file
 * rather than the per-file document it used to die with. */
const BP_SM = '480px';

test('arena-page-head: the root recipe classes land on the host element itself', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  try {
    const fixture = createPageHeadWithoutActionsFixture();
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
    for (const cls of pageHeadStyles().root().split(/\s+/))
      assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
    assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
  } finally {
    document.documentElement.style.removeProperty('--bp-sm');
  }
});

test('arena-page-head: an unmeasured width renders the WIDE layout, so the narrow branch never flashes on first paint', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  try {
    const fixture = createPageHeadWithoutActionsFixture();
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
    assert.ok(host.classList.contains('flex-row'), `an unmeasured page head must render as a row: "${host.className}"`);
    assert.ok(host.classList.contains('items-start'), `an unmeasured page head must render top-aligned: "${host.className}"`);
    assert.ok(!host.classList.contains('flex-col'), 'the narrow branch must not render before anything has been measured');
  } finally {
    document.documentElement.style.removeProperty('--bp-sm');
  }
});

/* Same fix as arena-empty-state's action wrapper above, and the same coverage
 * shape: only the negative case is exercised, because nothing in this file
 * projects into `[actions]`. That negative case is real coverage of the same
 * reported bug's exact repro, ported to `arena-page-head`'s own actions slot:
 * that slot sits in a `gap-4` flex parent and carries `shrink-0` plus its own
 * `w-auto`/`w-full`, so an unprojected wrapper would ship a gap's worth of
 * dead space to every page with no actions. It is gated on the shared
 * `ArenaActions` marker (`../primitives/projection-markers`), the plural
 * sibling of the `ArenaAction` that `arena-empty-state` uses. */
test('arena-page-head: the actions wrapper is absent from the DOM when no [actions] content is projected', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  try {
    const fixture = createPageHeadWithoutActionsFixture();
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
  } finally {
    document.documentElement.style.removeProperty('--bp-sm');
  }
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
    const fixture = createPageHeadWithoutActionsFixture();
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
    assert.ok(host.classList.contains('flex-row'), `with no ResizeObserver the width stays null, which is the wide layout: "${host.className}"`);
  } finally {
    globals.ResizeObserver = saved;
    document.documentElement.style.removeProperty('--bp-sm');
  }
});

/* Every primitive except `arena-activity-feed` host-binds its recipe's
 * visible slot directly onto its own custom element (this file's own header
 * comment) -- `arena-activity-feed`'s root is a real `<ul>` instead, since a
 * native list structure cannot be an unknown custom element; see
 * components-divergences.md ("ActivityFeed is the Angular primitive that
 * does not host-bind its root"). Either way the manifest's `root` slot
 * still needs a display utility below: an unknown element's UA-default
 * display is `inline` -- a box that a width/height utility cannot size, and
 * `arena-activity-feed`'s own manifest keeps one too even though its root
 * lands on a real `<ul>`, so the check stays uniform across every
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
 * in effect. It is not: `frameworks/tailwind/Utilities.css` wraps every
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

/* manifestFiles() already walks components/<category>/<component>/ for every
 * manifest under the tree -- its own doc comment in tailwind-compile.mjs warns
 * that three gates once found manifests by their own flat readdirSync, and
 * that three spellings of the same walk is how one of them ends up missing a
 * category nobody remembers to add. Reached the same way compliance.ts reaches
 * behaviour-compliance.mjs and behaviour-contracts.mjs: a dynamic import of an
 * absolute file URL, resolved at call time from LIB, so it works unmodified
 * from both frameworks/angular/test/ and the ngc emit at
 * build/angular-test/angular/test/, where a static relative specifier would
 * point at a directory that does not exist (see compliance.ts's own comment on
 * REPO for why). It stays untyped for the same reason: a plain .mjs helper
 * with JSDoc types only, no declaration file generated anywhere. */
const { manifestFiles } = await import(pathToFileURL(join(LIB, 'tailwind-compile.mjs')).href);

/** Finds a manifest by filename among every manifest `manifestFiles()` found
 *  under the Tailwind components tree, rather than assuming it sits flat in
 *  `componentsDir`. Returns undefined rather than throwing so a caller can
 *  assert absence (see NO_MANIFEST below) as well as presence. */
function findManifestFile(componentsDir: string, filename: string): string | undefined {
  const paths: string[] = manifestFiles(componentsDir);
  return paths.find((p) => basename(p) === filename);
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
  const primitivesDir = ANGULAR_PRIMITIVES;
  const manifestsDir = TAILWIND_COMPONENTS;
  const names = readdirSync(primitivesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.ok(names.length > 0, 'no primitive directories found -- the guard would silently check nothing');

  for (const excluded of NO_MANIFEST) {
    assert.ok(names.includes(excluded), `NO_MANIFEST names "${excluded}", which is not a primitive directory -- stale entry`);
    const excludedManifestName = `${kebabToPascal(excluded)}.manifest.json`;
    const excludedManifestPath = findManifestFile(manifestsDir, excludedManifestName);
    assert.ok(
      excludedManifestPath === undefined,
      `NO_MANIFEST names "${excluded}", but ${excludedManifestPath} now exists -- the exclusion is stale and should be removed so this primitive is checked like every other one`,
    );
  }

  for (const name of names) {
    if (NO_MANIFEST.has(name)) continue;
    const manifestName = `${kebabToPascal(name)}.manifest.json`;
    const manifestPath = findManifestFile(manifestsDir, manifestName);
    assert.ok(manifestPath !== undefined, `${name}: no manifest named ${manifestName} found anywhere under ${manifestsDir}`);
    const manifest = JSON.parse(readFileSync(manifestPath as string, 'utf8')) as { slots?: Record<string, string> };
    const root = manifest.slots?.['root'];
    assert.ok(typeof root === 'string', `${name}: ${manifestPath} has no "slots.root" string`);
    assert.match(
      root as string,
      DISPLAY_UTILITY,
      `${name}: root slot "${root}" carries no display utility -- host-binding it collapses to the UA-default inline box`,
    );
  }
});

/* The four tests below are the manifest guard's counterpart for a primitive
 * that has no manifest to guard. `labels` and `values` became required signal
 * inputs under the API contract (`api/components/BarChart.json`), and
 * `createBarChartHost()` carries them in on `BarChartHost`'s own two template
 * bindings. The host's fields are EMPTY arrays:
 * everything asserted here -- the host box, the style-object binding, the
 * token-valued SVG presentation styles and the fallback accessible name --
 * renders with no data at all, because `ticks` always yields five grid lines.
 * The geometry that does need real data is asserted as plain functions in
 * bar-chart-geometry.test.ts instead. */

test('arena-bar-chart: the host is a block-level box, so the width it measures is a real content width', async () => {
  const fixture = createBarChartHost();
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
  const fixture = createBarChartHost();
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
  const fixture = createBarChartHost();
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
  const fixture = createBarChartHost();
  await fixture.whenStable();
  const svg = fixture.nativeElement.querySelector('arena-bar-chart svg') as SVGElement;
  assert.equal(svg.getAttribute('role'), 'img');
  // No seriesLabel is set, so this is the fallback name -- a role="img" with no
  // name announces as an unlabeled graphic.
  assert.equal(svg.getAttribute('aria-label'), 'Bar chart');
  const caption = fixture.nativeElement.querySelector('arena-bar-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Bar chart');
});

/* The same four assertions, ported to the second hand-written chart. `labels` and
 * `values` became required signal inputs under the API contract
 * (`api/components/LineChart.json`), and `createLineChartHost()` carries them in
 * on `LineChartHost`'s own two template bindings. The host's fields are EMPTY
 * arrays, and everything asserted here
 * still renders: an empty `values` draws the value axis anyway (`ticks` always
 * yields five) and still renders the numbers table.
 * `line-chart-geometry.test.ts` carries the geometry that does need real data, as
 * plain functions. */

test('arena-line-chart: the host is a block-level box, so the width it measures is a real content width', async () => {
  const fixture = createLineChartHost();
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
  const fixture = createLineChartHost();
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
  const fixture = createLineChartHost();
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
  const fixture = createLineChartHost();
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
 * empty inputs and their token styles can be read off the real DOM. A doughnut has no
 * axis -- with an empty `values` there is no slice and no centre label. `labels` and
 * `values` became required signal inputs under the API contract
 * (`api/components/DoughnutChart.json`), and all five tests below take them from
 * `DoughnutChartHost`'s own two template bindings; its fields are EMPTY arrays
 * deliberately, keeping these five about the no-data render. So the `<path>`'s `strokeWidth: 'var(--bw-strong)'` and the centre
 * label's `fontSize: 'var(--dz-text-lg)'` are NOT render-provable here, and nothing
 * below pretends otherwise. What covers them instead:
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
  const fixture = createDoughnutChartHost();
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
  // the legend is the same token the plot width subtracts as a number.
  assert.equal(host.style.width, '100%');
  assert.equal(host.style.gap, 'var(--chart-legend-gap)');
});

test('arena-doughnut-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = createDoughnutChartHost();
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
  const fixture = createDoughnutChartHost();
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
  const fixture = createDoughnutChartHost();
  await fixture.whenStable();
  const svg = fixture.nativeElement.querySelector('arena-doughnut-chart svg') as SVGElement;
  assert.equal(svg.getAttribute('role'), 'img');
  // No seriesLabel is set on the fixture, so this is the FALLBACK name rather than a
  // constant: the doughnut gained a `seriesLabel` under the API contract
  // (`api/components/DoughnutChart.json`), and `name()` reads
  // `<seriesLabel> — doughnut chart` when one is given. Pinning the fallback is
  // deliberate -- a role="img" with no name announces as an unlabeled graphic, so the
  // unnamed case is the one that must never regress to empty.
  assert.equal(svg.getAttribute('aria-label'), 'Doughnut chart');
  const caption = fixture.nativeElement.querySelector('arena-doughnut-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Doughnut chart');
});

test('arena-doughnut-chart: with no data it draws no slice at all, rather than an empty ring', async () => {
  const fixture = createDoughnutChartHost();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;
  // `@if (segment.path)` is the gate: a zero-width slice yields '' and must not reach
  // the DOM as a `d=""` path. This is the empty case rendering for real, not a stand-in.
  assert.equal(host.querySelector('path'), null, 'an empty doughnut must paint no slice');
  assert.equal(host.querySelector('text'), null, 'the centre label must not render with nothing hovered');
  assert.equal(host.querySelectorAll('tbody tr').length, 0, 'the numbers table must have no rows');
});

test('arena-unauth-card: the root recipe classes land on the host element itself, and a consumer class survives the binding', async () => {
  const fixture = TestBed.createComponent(UnauthCardWithoutProjectionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-unauth-card') as HTMLElement;
  for (const cls of unauthCardStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  assert.ok(host.classList.contains('consumer-class'), `host lost the consumer's static class: "${host.className}"`);
});

/* Same fix, same toolchain limitation `arena-empty-state`'s and
 * `arena-error-state`'s own action-wrapper tests document above: `[brand]`
 * and `[footer]` are React's `{brand && <div>...}` / `{footer && <div>...}`
 * gates ported to Angular's own idiom, `contentChild(ArenaBrand)` /
 * `contentChild(ArenaFooter)` (`../primitives/projection-markers`). The
 * positive case -- something actually projected into either slot -- is not
 * exercised by any test in this file. What IS covered: with nothing projected into either
 * slot, both wrappers -- `mb-7` on `brand`, `mt-5` on `footer` -- must be
 * entirely absent from the DOM, so a consumer who supplies neither ships no
 * dead space for either, matching React's exact gate rather than the task
 * brief's own sample template, which rendered both unconditionally. */
test('arena-unauth-card: the brand and footer wrappers are both absent from the DOM when nothing is projected into either', async () => {
  const fixture = TestBed.createComponent(UnauthCardWithoutProjectionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-unauth-card') as HTMLElement;

  const brandClass = unauthCardStyles().brand().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`.${brandClass}`),
    null,
    'the brand wrapper div must not render when the [brand] slot is empty',
  );
  const footerClass = unauthCardStyles().footer().split(/\s+/)[0];
  assert.equal(
    host.querySelector(`.${footerClass}`),
    null,
    'the footer wrapper div must not render when the [footer] slot is empty',
  );
  // `UnauthCardWithoutProjectionHost` supplies no eyebrow and no title either, so
  // the panel and its body are the only two elements the bare card renders.
  const panelClass = unauthCardStyles().panel().split(/\s+/)[0];
  const bodyClass = unauthCardStyles().body().split(/\s+/)[0];
  assert.ok(host.querySelector(`.${panelClass}`), 'the panel must always render -- it is not gated');
  assert.ok(host.querySelector(`.${bodyClass}`), 'the body wrapper must always render -- it is not gated');
  assert.equal(host.children.length, 1, 'the host renders only the panel div, unconditionally');
});

