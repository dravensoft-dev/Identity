import '@angular/compiler';
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoNode } from './NodeAssert';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { useTestEnvironment } from './TestbedEnv';
import { ANGULAR_COMPONENTS, LIB, SCRIPTS, TAILWIND_COMPONENTS } from './Compliance';
import { ActivityFeed } from '../components/display/activity-feed/ActivityFeed';
import { activityFeedStyles } from '../components/display/activity-feed/ActivityFeed.variants';
import { AppLogo } from '../components/brand/app-logo/AppLogo';
import { appLogoStyles } from '../components/brand/app-logo/AppLogo.variants';
import { Avatar } from '../components/display/avatar/Avatar';
import { avatarStyles } from '../components/display/avatar/Avatar.variants';
import { BarChart } from '../components/charts/bar-chart/BarChart';
import { Breadcrumbs } from '../components/navigation/breadcrumbs/Breadcrumbs';
import type { Crumb } from '../Api.generated';
import { breadcrumbsStyles } from '../components/navigation/breadcrumbs/Breadcrumbs.variants';
import { BulkActionBar } from '../components/navigation/bulk-action-bar/BulkActionBar';
import type { BulkAction } from '../Api.generated';
import { bulkActionBarStyles } from '../components/navigation/bulk-action-bar/BulkActionBar.variants';
import { ChartCard } from '../components/charts/chart-card/ChartCard';
import { chartCardStyles } from '../components/charts/chart-card/ChartCard.variants';
import { DoughnutChart } from '../components/charts/doughnut-chart/DoughnutChart';
import { EmptyState } from '../components/feedback/empty-state/EmptyState';
import { emptyStateStyles } from '../components/feedback/empty-state/EmptyState.variants';
import { ErrorState } from '../components/feedback/error-state/ErrorState';
import { errorStateStyles } from '../components/feedback/error-state/ErrorState.variants';
import { LineChart } from '../components/charts/line-chart/LineChart';
import { PageHead } from '../components/navigation/page-head/PageHead';
import { pageHeadStyles } from '../components/navigation/page-head/PageHead.variants';
import { Skeleton } from '../components/display/skeleton/Skeleton';
import { skeletonStyles } from '../components/display/skeleton/Skeleton.variants';
import { StatCard } from '../components/display/stat-card/StatCard';
import { statCardStyles } from '../components/display/stat-card/StatCard.variants';
import type { StatDelta } from '../Api.generated';
import { Tag } from '../components/display/tag/Tag';
import { tagStyles } from '../components/display/tag/Tag.variants';
import { UnauthCard } from '../components/display/unauth-card/UnauthCard';
import { unauthCardStyles } from '../components/display/unauth-card/UnauthCard.variants';

useTestEnvironment();

@Component({
  standalone: true,
  imports: [AppLogo],
  template: `<arena-app-logo name="Draven" class="consumer-class"><span mark>mark</span></arena-app-logo>`,
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
  template: `<arena-breadcrumbs class="consumer-class" ariaLabel="Project navigation" [items]="items" />`,
})
class BreadcrumbsHost {
  items: Crumb[] = [];
}

function createBreadcrumbsHost(items: Crumb[] = []) {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  fixture.componentInstance.items = items;
  return fixture;
}

@Component({
  standalone: true,
  imports: [StatCard],
  template: `<arena-stat-card class="consumer-class" label="Revenue" value="$48.2k" />`,
})
class StatCardHost {}

function renderStatCard(label: string, value: string, delta?: StatDelta, icon?: string) {
  const fixture = TestBed.createComponent(StatCard);
  fixture.componentRef.setInput('label', label);
  fixture.componentRef.setInput('value', value);
  if (delta !== undefined) fixture.componentRef.setInput('delta', delta);
  if (icon !== undefined) fixture.componentRef.setInput('icon', icon);
  return fixture;
}

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

function createDoughnutChartHost() {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  fixture.detectChanges();
  return fixture;
}

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

  (fixture.nativeElement as HTMLElement).classList.add('consumer-class');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  assert.ok(host.classList.contains('consumer-class'), `host lost the pre-existing class: "${host.className}"`);
  for (const cls of appLogoStyles().root().split(/\s+/))
    assert.ok(host.classList.contains(cls), `host is missing root class "${cls}"`);
  fixture.destroy();
});

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

  for (const node of Array.from(nameEl.childNodes))
    assert.notEqual(node.nodeType, Node.ELEMENT_NODE, 'no dim was set, so no dim <span> should render');

  assert.equal(nameEl.children.length, 0, 'no dim was set, so the name slot should have no element children');
  fixture.destroy();
});

test('arena-app-logo: a static "name" attribute satisfies the required input and is then cleared off the element', () => {
  const fixture = TestBed.createComponent(AppLogoStaticAttributeHost);
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector('arena-app-logo') as HTMLElement;
  assert.equal(host.getAttribute('name'), null,
    'the static attribute survived on the host. Angular writes it during the creation pass whether or not it '
    + "also matches an input, which is what '[attr.name]': 'null' in the host block exists to undo — a stray "
    + 'global attribute the consumer never meant to set, and for `title` a browser tooltip over the whole component.');
  assert.ok(host.classList.contains('consumer-class'), `sanity: the static class attribute survives the host [class] binding: "${host.className}"`);
  const nameClass = appLogoStyles().name().split(/\s+/)[0];
  assert.equal(
    (host.querySelector(`.${nameClass}`) as HTMLElement | null)?.textContent,
    'Draven',
    'the attribute must reach the name input, not merely sit on the element',
  );
  fixture.destroy();
});

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

function renderActivityFeed(items: unknown[]) {
  const fixture = TestBed.createComponent(ActivityFeed);
  fixture.componentRef.setInput('label', 'Deployment activity');
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

test('arena-activity-feed: actor, action and target compose with exactly one space between them, and time is absent when unset', () => {
  const fixture = renderActivityFeed([
    { id: '1', actor: 'Marta', action: 'deployed', target: 'billing@2.4.1' },
  ]);
  fixture.detectChanges();
  const li = (fixture.nativeElement as HTMLElement).querySelector('li') as HTMLElement;

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
  assert.equal(host.getAttribute('aria-label'), 'Project navigation',
    'the landmark name must come from the ariaLabel input, not from a constant the component owns');
  assert.equal(host.children.length, 0, 'with no items, the trail renders no crumbs of its own');
  fixture.destroy();
});

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

test('arena-stat-card: a delta with a value renders the pill; a delta with a tone but no value renders nothing', () => {
  const withValue = renderStatCard('Deploys', '128', { value: '+12%', direction: 'up', tone: 'positive' });
  withValue.detectChanges();
  const deltaClass = statCardStyles().delta().split(/\s+/)[0];
  assert.ok((withValue.nativeElement as HTMLElement).querySelector(`.${deltaClass}`), 'a delta with a value must render the pill');
  withValue.destroy();

  const emptyValue = renderStatCard('Deploys', '128', { value: '', direction: 'up', tone: 'positive' });
  emptyValue.detectChanges();
  assertNoNode(
    (emptyValue.nativeElement as HTMLElement).querySelector(`.${deltaClass}`),
    'a delta with a tone/direction but an empty value must render no pill at all',
  );
  emptyValue.destroy();
});

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
  assertNoNode(host.querySelector(`.${iconClass}`), 'no icon means no icon wrapper at all');
  fixture.destroy();
});

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

test('arena-chart-card: the head row is entirely absent when there is neither a title nor projected actions', async () => {
  const fixture = TestBed.createComponent(ChartCardHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-chart-card') as HTMLElement;
  const headClass = chartCardStyles().head().split(/\s+/)[0];
  assertNoNode(
    host.querySelector(`.${headClass}`),
    'an empty chart card (no title, no actions) must not render the head row at all',
  );
  assert.equal(host.children.length, 0, 'a bare chart card renders no children of its own');
});

function renderEmptyState(title: string) {
  const fixture = TestBed.createComponent(EmptyState);
  fixture.componentRef.setInput('title', title);
  return fixture;
}

test('arena-empty-state: the action wrapper is absent from the DOM when no [action] content is projected', () => {
  const fixture = renderEmptyState('No projects yet');
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  assertNoNode(host.querySelector('button'), 'no action was projected, so no action markup should exist at all');
  const actionClass = emptyStateStyles().action().split(/\s+/)[0];
  assertNoNode(
    host.querySelector(`:scope > .${actionClass}`),
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

test('arena-error-state: the actions wrapper is absent from the DOM when neither retryLabel nor [secondaryAction] content is projected', async () => {
  const fixture = TestBed.createComponent(ErrorStateWithoutActionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-error-state') as HTMLElement;
  assertNoNode(host.querySelector('button'), 'neither retryLabel nor a secondary action was supplied, so no action markup should exist at all');
  const actionsClass = errorStateStyles().actions().split(/\s+/)[0];
  assertNoNode(
    host.querySelector(`:scope > .${actionsClass}`),
    'the actions wrapper div must not render when both retryLabel and secondaryAction are absent',
  );
});

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

test('arena-page-head: the actions wrapper is absent from the DOM when no [actions] content is projected', async () => {
  document.documentElement.style.setProperty('--bp-sm', BP_SM);
  try {
    const fixture = createPageHeadWithoutActionsFixture();
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement.querySelector('arena-page-head') as HTMLElement;
    assertNoNode(host.querySelector('button'), 'no actions were projected, so no action markup should exist at all');
    const actionsClass = pageHeadStyles().actions().split(/\s+/)[0];
    assertNoNode(
      host.querySelector(`:scope > .${actionsClass}`),
      'the actions wrapper div must not render when the actions slot is empty',
    );
    assert.equal(host.children.length, 1, 'a page head with no actions renders the titles block and nothing else');
  } finally {
    document.documentElement.style.removeProperty('--bp-sm');
  }
});

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

const DISPLAY_UTILITY =
  /(?:^|\s)(?:block|inline-block|inline|flex|inline-flex|grid|inline-grid|table|inline-table|table-[a-z-]+|flow-root|contents|list-item|hidden)(?=\s|$)/;

const { pascal: kebabToPascal } = await import(
  pathToFileURL(join(SCRIPTS, 'check-structure.mjs')).href
) as { pascal: (dirName: string) => string };

const { manifestFiles } = await import(pathToFileURL(join(LIB, 'tailwind-compile.mjs')).href);

function findManifestFile(componentsDir: string, filename: string): string | undefined {
  const paths: string[] = manifestFiles(componentsDir);
  return paths.find((p) => basename(p) === filename);
}

const NO_MANIFEST = new Set(['bar-chart', 'line-chart', 'doughnut-chart']);

const HOST_SLOT: Record<string, { manifest?: string; slot: string }> = {
  'calendar-event': { manifest: 'Calendar.manifest.json', slot: 'chip' },
  dialog: { slot: 'scrim' },
  'radio-group': { manifest: 'Radio.manifest.json', slot: 'group' },
  'side-nav-collapsible': { manifest: 'SideNav.manifest.json', slot: 'section' },
  'side-nav-item': { manifest: 'SideNav.manifest.json', slot: 'item' },
  'side-nav-section': { manifest: 'SideNav.manifest.json', slot: 'section' },
  'segmented-control': { slot: 'track' },
  tab: { manifest: 'Tabs.manifest.json', slot: 'panel' },
  'table-cell': { manifest: 'Table.manifest.json', slot: 'td' },
  'table-row': { manifest: 'Table.manifest.json', slot: 'row' },
};

test('every Angular primitive host-binds a slot that carries a display utility, so the host never collapses to the UA-default inline box', () => {
  const componentsDir = ANGULAR_COMPONENTS;
  const manifestsDir = TAILWIND_COMPONENTS;

  const names = readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((category) =>
      readdirSync(join(componentsDir, category.name), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name),
    );
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

  for (const dir of Object.keys(HOST_SLOT)) {
    assert.ok(names.includes(dir), `HOST_SLOT names "${dir}", which is not a primitive directory -- stale entry`);
  }

  for (const name of names) {
    if (NO_MANIFEST.has(name)) continue;
    const override = HOST_SLOT[name];
    const slot = override?.slot ?? 'root';
    const manifestName = override?.manifest ?? `${kebabToPascal(name)}.manifest.json`;

    if (override?.manifest !== undefined) {
      const ownName = `${kebabToPascal(name)}.manifest.json`;
      assert.equal(
        findManifestFile(manifestsDir, ownName), undefined,
        `HOST_SLOT sends "${name}" to ${manifestName}, but ${ownName} now exists -- it no longer shares its family's recipe, so the entry is stale`,
      );
    }

    const manifestPath = findManifestFile(manifestsDir, manifestName);
    assert.ok(manifestPath !== undefined, `${name}: no manifest named ${manifestName} found anywhere under ${manifestsDir}`);
    const manifest = JSON.parse(readFileSync(manifestPath as string, 'utf8')) as { slots?: Record<string, string> };
    const classes = manifest.slots?.[slot];
    assert.ok(typeof classes === 'string', `${name}: ${manifestPath} has no "slots.${slot}" string`);
    assert.match(
      classes as string,
      DISPLAY_UTILITY,
      `${name}: the "${slot}" slot it host-binds carries no display utility -- host-binding it collapses to the UA-default inline box`,
    );
  }
});

const HOST_BOUND_ROOT = /'\[class\]':/;
const HOST_STATIC_DISPLAY = /host:\s*\{[^}]*\bstyle:\s*'[^']*display\s*:/s;

test('a primitive that does not host-bind its root takes its host out of layout with display: contents', () => {
  const componentsDir = ANGULAR_COMPONENTS;
  const sources: Array<{ name: string; path: string; source: string }> = [];

  for (const category of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(componentsDir, category.name), { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const name = kebabToPascal(dir.name);
      const path = join(componentsDir, category.name, dir.name, `${name}.ts`);
      sources.push({ name, path, source: readFileSync(path, 'utf8') });
    }
  }
  assert.ok(sources.length > 0, 'no primitive sources found -- the guard would silently check nothing');

  for (const { name, path, source } of sources) {
    if (HOST_BOUND_ROOT.test(source)) continue;
    assert.match(
      source,
      HOST_STATIC_DISPLAY,
      `${path}: ${name} leaves its host bare and declares no display on it. An <arena-x> with no `
      + 'display is an inline box, and as a flex item it blockifies to shrink-to-fit -- so a '
      + "w-full on the real element inside resolves against the shrunk host and does nothing. "
      + 'Either host-bind the root slot, or take the host out of layout with display: contents.',
    );
  }
});

const GLOBAL_ATTRIBUTE_INPUTS = ['title', 'name'] as const;

function hostBlockOf(source: string): string {
  const at = source.indexOf('host: {');
  if (at === -1) return '';
  let depth = 0;
  for (let i = source.indexOf('{', at); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(at, i + 1);
    }
  }
  return '';
}

function primitiveSources(): Array<{ name: string; path: string; source: string }> {
  const out: Array<{ name: string; path: string; source: string }> = [];
  for (const category of readdirSync(ANGULAR_COMPONENTS, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(ANGULAR_COMPONENTS, category.name), { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const name = kebabToPascal(dir.name);
      const path = join(ANGULAR_COMPONENTS, category.name, dir.name, `${name}.ts`);
      out.push({ name, path, source: readFileSync(path, 'utf8') });
    }
  }
  return out;
}

test('a primitive whose input is named after a global HTML attribute clears that attribute off its host', () => {
  const sources = primitiveSources();
  assert.ok(sources.length > 0, 'no primitive sources found -- the guard would silently check nothing');

  const problems: string[] = [];
  let declared = 0;

  for (const { name, path, source } of sources) {
    const host = hostBlockOf(source);
    for (const attribute of GLOBAL_ATTRIBUTE_INPUTS) {
      const takesInput = new RegExp(`^  readonly ${attribute} = input`, 'm').test(source);
      const clears = host.includes(`'[attr.${attribute}]': 'null'`);
      if (takesInput) declared += 1;

      if (takesInput && !clears) {
        problems.push(
          `${path}: ${name} takes a \`${attribute}\` input and does not clear the attribute. `
          + 'Angular writes a static attribute to the DOM during the creation pass whether or not it '
          + `also matches an input, so <arena-${name.toLowerCase()} ${attribute}="…"> leaves a real `
          + `${attribute} on the host` + (attribute === 'title' ? ' and the browser draws a tooltip over it' : '')
          + `. Add '[attr.${attribute}]': 'null' to the host block.`,
        );
      }
      if (!takesInput && clears) {
        problems.push(
          `${path}: ${name} clears the ${attribute} attribute and declares no \`${attribute}\` input -- `
          + 'stale, and it now removes an attribute a consumer may have meant to set.',
        );
      }
    }
  }

  assert.ok(declared > 0, 'no primitive declares a title or name input -- the guard matched nothing, so it proves nothing');
  assert.deepEqual(problems, [], `\n  ${problems.join('\n  ')}`);
});

@Component({
  standalone: true,
  imports: [PageHead, Avatar],
  template: `
    <arena-page-head title="Projects" />
    <arena-page-head [title]="bound" />
    <arena-avatar name="Ada Lovelace" />
  `,
})
class StrayAttributeHost {
  bound = 'Deployments';
}

test('the clearing binding removes a STATIC attribute and leaves the input holding its value', () => {
  useTestEnvironment();
  const fixture = TestBed.createComponent(StrayAttributeHost);
  fixture.detectChanges();
  try {
    const [statik, bound] = [...fixture.nativeElement.querySelectorAll('arena-page-head')] as HTMLElement[];
    const avatar = fixture.nativeElement.querySelector('arena-avatar') as HTMLElement;

    assert.equal(statik.hasAttribute('title'), false,
      'the static title survived on the host, so the browser draws a tooltip over the whole header');
    assert.equal(statik.querySelector('h1')?.textContent?.trim(), 'Projects',
      'clearing the attribute also took the value away from the input, which is the wrong half to remove');

    assert.equal(bound.hasAttribute('title'), false, 'a bound title must never reach the DOM as an attribute');
    assert.equal(bound.querySelector('h1')?.textContent?.trim(), 'Deployments');

    assert.equal(avatar.hasAttribute('name'), false, 'the static name survived on the host');
    assert.match(avatar.textContent ?? '', /AL/,
      'the initials are derived from the `name` input, so clearing the attribute must not empty it');
  } finally {
    fixture.destroy();
  }
});

test('arena-bar-chart: the host is a block-level box, so the width it measures is a real content width', async () => {
  const fixture = createBarChartHost();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-bar-chart') as HTMLElement;

  assert.equal(host.style.display, 'block', `host declared display "${host.style.display}"`);
  assert.equal(getComputedStyle(host).display, 'block');

  assert.equal(host.style.position, 'relative');
});

test('arena-bar-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = createBarChartHost();
  await fixture.whenStable();
  const table = fixture.nativeElement.querySelector('arena-bar-chart table') as HTMLElement;
  assert.ok(table, 'the visually-hidden numbers table did not render');

  assert.ok(!(table.getAttribute('style') ?? '').includes('[object Object]'),
    `the style object was stringified: "${table.getAttribute('style')}"`);
  assert.equal(table.style.position, 'absolute');
  assert.equal(table.style.width, '1px');
  assert.equal(table.style.height, '1px');
  assert.equal(table.style.margin, '-1px');

});

test('arena-bar-chart: the SVG presentation styles reach the DOM as tokens, not as literals', async () => {
  const fixture = createBarChartHost();
  await fixture.whenStable();

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

  assert.equal(svg.getAttribute('aria-label'), 'Bar chart');
  const caption = fixture.nativeElement.querySelector('arena-bar-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Bar chart');
});

test('arena-line-chart: the host is a block-level box, so the width it measures is a real content width', async () => {
  const fixture = createLineChartHost();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-line-chart') as HTMLElement;

  assert.equal(host.style.display, 'block', `host declared display "${host.style.display}"`);
  assert.equal(getComputedStyle(host).display, 'block');

  assert.equal(host.style.position, 'relative');
});

test('arena-line-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = createLineChartHost();
  await fixture.whenStable();
  const table = fixture.nativeElement.querySelector('arena-line-chart table') as HTMLElement;
  assert.ok(table, 'the visually-hidden numbers table did not render');

  assert.ok(!(table.getAttribute('style') ?? '').includes('[object Object]'),
    `the style object was stringified: "${table.getAttribute('style')}"`);
  assert.equal(table.style.position, 'absolute');
  assert.equal(table.style.width, '1px');
  assert.equal(table.style.height, '1px');
  assert.equal(table.style.margin, '-1px');

});

test('arena-line-chart: the SVG presentation styles reach the DOM as tokens, not as literals', async () => {
  const fixture = createLineChartHost();
  await fixture.whenStable();

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

  assert.equal(svg.getAttribute('aria-label'), 'Line chart');
  const caption = fixture.nativeElement.querySelector('arena-line-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Line chart');
});

test('arena-doughnut-chart: the host is the flex row itself, so the box it measures is the box it lays out', async () => {
  const fixture = createDoughnutChartHost();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;

  assert.equal(host.style.display, 'flex', `host declared display "${host.style.display}"`);
  assert.equal(getComputedStyle(host).display, 'flex');

  assert.equal(host.style.position, 'relative');

  assert.equal(host.style.width, '100%');
  assert.equal(host.style.gap, 'var(--chart-legend-gap)');
});

test('arena-doughnut-chart: the numbers table is bound as a style object, not stringified into the attribute', async () => {
  const fixture = createDoughnutChartHost();
  await fixture.whenStable();
  const table = fixture.nativeElement.querySelector('arena-doughnut-chart table') as HTMLElement;
  assert.ok(table, 'the visually-hidden numbers table did not render');

  assert.ok(!(table.getAttribute('style') ?? '').includes('[object Object]'),
    `the style object was stringified: "${table.getAttribute('style')}"`);
  assert.equal(table.style.position, 'absolute');
  assert.equal(table.style.width, '1px');
  assert.equal(table.style.height, '1px');
  assert.equal(table.style.margin, '-1px');

});

test('arena-doughnut-chart: the style objects that render without data reach the DOM as real declarations', async () => {
  const fixture = createDoughnutChartHost();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;

  const svg = host.querySelector('svg') as SVGElement;
  assert.equal(svg.style.display, 'block');
  assert.equal(svg.style.flexShrink, '0');

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

  assert.equal(svg.getAttribute('aria-label'), 'Doughnut chart');
  const caption = fixture.nativeElement.querySelector('arena-doughnut-chart table caption') as HTMLElement;
  assert.equal(caption.textContent?.trim(), 'Doughnut chart');
});

test('arena-doughnut-chart: with no data it draws no slice at all, rather than an empty ring', async () => {
  const fixture = createDoughnutChartHost();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-doughnut-chart') as HTMLElement;

  assertNoNode(host.querySelector('path'), 'an empty doughnut must paint no slice');
  assertNoNode(host.querySelector('text'), 'the centre label must not render with nothing hovered');
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

test('arena-unauth-card: the brand and footer wrappers are both absent from the DOM when nothing is projected into either', async () => {
  const fixture = TestBed.createComponent(UnauthCardWithoutProjectionHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.nativeElement.querySelector('arena-unauth-card') as HTMLElement;

  const brandClass = unauthCardStyles().brand().split(/\s+/)[0];
  assertNoNode(
    host.querySelector(`.${brandClass}`),
    'the brand wrapper div must not render when the [brand] slot is empty',
  );
  const footerClass = unauthCardStyles().footer().split(/\s+/)[0];
  assertNoNode(
    host.querySelector(`.${footerClass}`),
    'the footer wrapper div must not render when the [footer] slot is empty',
  );

  const panelClass = unauthCardStyles().panel().split(/\s+/)[0];
  const bodyClass = unauthCardStyles().body().split(/\s+/)[0];
  assert.ok(host.querySelector(`.${panelClass}`), 'the panel must always render -- it is not gated');
  assert.ok(host.querySelector(`.${bodyClass}`), 'the body wrapper must always render -- it is not gated');
  assert.equal(host.children.length, 1, 'the host renders only the panel div, unconditionally');
});
