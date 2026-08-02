/* contracts/api/README.md requires a guarded name to be refused when it is blank AFTER TRIMMING:
 * a name of nothing but spaces satisfies a falsiness test and names nothing, and it is the one
 * input the guard exists to catch. The set is derived from the contracts rather than listed here,
 * so an eighth guarded name joins by being declared. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REACT_COMPONENTS } from './AssertPattern.tsx';
import { SideNav } from '../components/navigation/side-nav/SideNav.tsx';
import { SideNavItem } from '../components/navigation/side-nav-item/SideNavItem.tsx';
import { SideNavSection } from '../components/navigation/side-nav-section/SideNavSection.tsx';
import { RadioGroup } from '../components/forms/radio-group/RadioGroup.tsx';
import { Breadcrumbs } from '../components/navigation/breadcrumbs/Breadcrumbs.tsx';
import { ActivityFeed } from '../components/display/activity-feed/ActivityFeed.tsx';
import { Table } from '../components/display/table/Table.tsx';
import { Pagination } from '../components/navigation/pagination/Pagination.tsx';
import { BottomNav } from '../components/navigation/bottom-nav/BottomNav.tsx';
import { Sheet } from '../components/feedback/sheet/Sheet.tsx';

interface MemberSpec { form?: string; type?: string; required?: boolean; description?: string }
const CONTRACTS = join(REACT_COMPONENTS, '../../../contracts/api/components');
const BLANK = '   ';

const WITH_A_BLANK_NAME = new Map([
  ['SideNav', () => <SideNav ariaLabel={BLANK}><SideNavItem id="a" label="Alpha" /></SideNav>],
  ['SideNavSection', () => <SideNavSection label={BLANK}><SideNavItem id="a" label="Alpha" /></SideNavSection>],
  ['RadioGroup', () => <RadioGroup ariaLabel={BLANK} value="a" />],
  ['Breadcrumbs', () => <Breadcrumbs ariaLabel={BLANK} items={[{ label: 'Home' }]} />],
  ['ActivityFeed', () => <ActivityFeed label={BLANK} items={[]} />],
  ['Table', () => <Table label={BLANK} columns={[{ header: 'A' }]} />],
  ['Pagination', () => <Pagination ariaLabel={BLANK} page={1} pageCount={3} />],
  ['Sheet', () => <Sheet open title={BLANK}>Two line items.</Sheet>],
  ['BottomNav', () => <BottomNav ariaLabel={BLANK} />],
]);

export function guardedNames(dir: string, read = readFileSync, list = readdirSync) {
  const found = [];
  for (const file of list(dir).filter((f) => f.endsWith('.json')).sort()) {
    const contract = JSON.parse(read(join(dir, file), 'utf8'));
    for (const [member, spec] of Object.entries(contract.api ?? {}) as [string, MemberSpec][]) {
      if (spec.form === 'primitive' && spec.type === 'string'
        && /guarded at runtime/.test(spec.description ?? '')) {
        found.push({ component: contract.component, member });
      }
    }
  }
  return found;
}

test('a name of nothing but spaces is refused, which is what the contract asks of a guard', () => {
  const declared = guardedNames(CONTRACTS);
  assert.ok(declared.length > 0, 'no contract declares a guarded name -- this suite matched nothing, so it proves nothing');

  for (const { component, member } of declared) {
    const render = WITH_A_BLANK_NAME.get(component);
    assert.ok(render, `${component}.${member} is a guarded name and this suite has no case for it -- add one`);
    assert.throws(
      () => renderToStaticMarkup(render()),
      (error) => error instanceof Error && error.message.startsWith(`${component}:`),
      `${component} accepted a \`${member}\` of nothing but spaces. A guard trims before it decides, `
      + 'or it misses the one value a present-but-useless name arrives as.',
    );
  }
});

test('the cases are the guarded names and nothing else, so a retired one cannot sit here unnoticed', () => {
  const declared = new Set(guardedNames(CONTRACTS).map((g) => g.component));
  for (const component of WITH_A_BLANK_NAME.keys()) {
    assert.ok(declared.has(component), `${component} has a case here and declares no guarded name -- stale, delete it`);
  }
});
