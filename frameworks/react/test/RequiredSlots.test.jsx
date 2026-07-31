/* `compareSurface` excludes slots from its required-ness comparison, because Angular's
 * <ng-content> cannot express mandatory -- so a contract declaring `"required": true` on a slot
 * holds React to something no gate checks. This is that check. It is derived from the contracts
 * rather than listed here, so a fifth required slot joins it by being declared, and the count
 * assertion fails if the set ever empties. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REACT_COMPONENTS } from './AssertPattern.jsx';
import { Tooltip } from '../components/feedback/tooltip/Tooltip.jsx';
import { Menu } from '../components/navigation/menu/Menu.jsx';
import { AppLogo } from '../components/brand/app-logo/AppLogo.jsx';
import { SideNavSection } from '../components/navigation/side-nav-section/SideNavSection.jsx';

const CONTRACTS = join(REACT_COMPONENTS, '../../../contracts/api/components');

const WITHOUT_THE_SLOT = new Map([
  ['Tooltip', () => <Tooltip label="Retry the build" />],
  ['Menu', () => <Menu items={[]} />],
  ['AppLogo', () => <AppLogo name="Dravensoft" />],
  ['SideNavSection', () => <SideNavSection label="Projects" />],
]);

export function requiredSlots(dir, read = readFileSync, list = readdirSync) {
  const found = [];
  for (const file of list(dir).filter((f) => f.endsWith('.json')).sort()) {
    const contract = JSON.parse(read(join(dir, file), 'utf8'));
    for (const [member, spec] of Object.entries(contract.api ?? {})) {
      if (spec.form === 'slot' && spec.required === true) found.push({ component: contract.component, member });
    }
  }
  return found;
}

test('every slot a contract declares required throws in React when it is omitted', () => {
  const declared = requiredSlots(CONTRACTS);
  assert.ok(declared.length > 0, 'no contract declares a required slot -- this suite matched nothing, so it proves nothing');

  for (const { component, member } of declared) {
    const render = WITHOUT_THE_SLOT.get(component);
    assert.ok(render, `${component}.${member} is a required slot and this suite has no case for it -- add one`);
    assert.throws(
      () => renderToStaticMarkup(render()),
      (error) => error instanceof Error && error.message.startsWith(`${component}:`),
      `${component} rendered without its required \`${member}\` slot instead of throwing. Angular cannot express a `
      + 'mandatory <ng-content>, so React is the only layer that can hold this contract, and nothing else checks it.',
    );
  }
});

test('the cases are the required slots and nothing else, so a retired one cannot sit here unnoticed', () => {
  const declared = new Set(requiredSlots(CONTRACTS).map((s) => s.component));
  for (const component of WITHOUT_THE_SLOT.keys()) {
    assert.ok(declared.has(component), `${component} has a case here and declares no required slot -- stale, delete it`);
  }
});
