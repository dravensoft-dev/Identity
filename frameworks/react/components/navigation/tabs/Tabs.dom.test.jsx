import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.jsx';
import { Tabs } from './Tabs.jsx';
import { Tab } from '../tab/Tab.jsx';

afterEach(cleanup);

const three = (props = {}) => (
  <Tabs defaultValue="ov" onChange={props.onChange}>
    <Tab value="ov" label="Overview"><p>overview body</p></Tab>
    <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
    <Tab value="ac" label="Activity"><p>activity body</p></Tab>
  </Tabs>
);

const tabsOf = (root) => [...root.querySelectorAll('[role="tab"]')];

const panelsOf = (root) => [...root.querySelectorAll('[role="tabpanel"]')];
const panelOf = (root) => panelsOf(root).find((p) => !p.hasAttribute('hidden'));
const stopsOf = (root) => tabsOf(root).filter((t) => t.getAttribute('tabindex') === '0');
const selectedOf = (root) => tabsOf(root).filter((t) => t.getAttribute('aria-selected') === 'true');
const arrow = (root, key) => act(() => {
  root.querySelector('[role="tablist"]')
    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
});

test('clicking a tab selects it: aria-selected, the tab stop and the panel all move together', () => {
  const root = mount(three());
  const [ov, dp] = tabsOf(root);
  assert.equal(ov.getAttribute('aria-selected'), 'true');
  assert.equal(dp.getAttribute('aria-selected'), 'false');

  act(() => { dp.click(); });

  const [ov2, dp2] = tabsOf(root);
  assert.equal(dp2.getAttribute('aria-selected'), 'true');
  assert.equal(ov2.getAttribute('aria-selected'), 'false');
  assert.equal(dp2.getAttribute('tabindex'), '0');
  assert.equal(ov2.getAttribute('tabindex'), '-1');
  assert.match(panelOf(root).textContent, /deployments body/);
});

test('change reported exactly one value per selection', () => {
  const seen = [];
  const root = mount(three({ onChange: (v) => seen.push(v) }));
  act(() => { tabsOf(root)[1].click(); });
  act(() => { tabsOf(root)[2].click(); });
  assert.deepEqual(seen, ['dp', 'ac']);
});

test('exactly one tab is in the tab sequence, before and after a move', () => {
  const root = mount(three());
  assert.equal(stopsOf(root).length, 1);
  arrow(root, 'ArrowRight');
  assert.equal(stopsOf(root).length, 1, 'a second tab stop appeared inside the tablist');
  assert.equal(stopsOf(root)[0].textContent, 'Deployments');
});

test('a value naming no tab is still operable: an arrow moves from the tab stop', () => {
  const seen = [];
  const root = mount(
    <Tabs value="nope" onChange={(v) => seen.push(v)}>
      <Tab value="ov" label="Overview"><p>overview body</p></Tab>
      <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
    </Tabs>,
  );
  assert.equal(selectedOf(root).length, 0, 'a tab was selected that the consumer did not ask for');
  assert.equal(stopsOf(root).length, 1, 'the strip has no tab stop -- it cannot be reached by keyboard');
  assert.equal(panelOf(root), undefined, 'a panel is shown for a tab that is not selected');
  arrow(root, 'ArrowRight');
  assert.deepEqual(seen, ['dp'], 'an arrow key reported nothing -- the strip is keyboard-dead');
  assert.equal(document.activeElement, tabsOf(root)[1], 'the arrow did not move focus');
});

test('tabs that arrive after mount are still operable, though nothing is selected', () => {
  let reveal;
  function Late() {
    const [ready, setReady] = React.useState(false);
    reveal = () => setReady(true);
    return (
      <Tabs>
        {ready && <Tab value="ov" label="Overview"><p>overview body</p></Tab>}
        {ready && <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>}
      </Tabs>
    );
  }
  const root = mount(<Late />);
  assert.equal(tabsOf(root).length, 0);
  act(() => { reveal(); });
  assert.equal(tabsOf(root).length, 2, 'the late tabs never rendered');
  assert.equal(selectedOf(root).length, 0, 'a tab was selected with no value naming it');
  assert.equal(stopsOf(root).length, 1,
    'a strip whose tabs arrived late has no tab stop -- it cannot be reached by keyboard');
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[1].getAttribute('aria-selected'), 'true',
    'an arrow key did not select -- the strip is keyboard-dead');
});

test('every tab controls a panel that exists, not only the selected one', () => {
  const root = mount(three());
  const ids = new Set(panelsOf(root).map((p) => p.getAttribute('id')));
  assert.equal(ids.size, 3, 'a panel per tab must exist, or the unselected tabs\' aria-controls dangle');
  for (const tab of tabsOf(root)) {
    const ref = tab.getAttribute('aria-controls');
    assert.ok(ref && ids.has(ref), `tab "${tab.textContent}" controls "${ref}", which nothing renders`);
    assert.equal(root.querySelector(`#${ref}`).getAttribute('aria-labelledby'), tab.getAttribute('id'),
      'a panel is labelled by a tab other than the one that controls it');
  }
  assert.equal(panelsOf(root).filter((p) => !p.hasAttribute('hidden')).length, 1,
    'exactly one panel is visible -- the rest are hidden, not absent');
});

test('ArrowRight moves selection and focus to the next tab', () => {
  const root = mount(three());
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[1].getAttribute('aria-selected'), 'true');

  assert.equal(document.activeElement, tabsOf(root)[1]);
  assert.match(panelOf(root).textContent, /deployments body/);
});

test('ArrowLeft moves the other way, and both directions wrap', () => {
  const root = mount(three());
  arrow(root, 'ArrowLeft');
  assert.equal(tabsOf(root)[2].getAttribute('aria-selected'), 'true', 'ArrowLeft did not wrap to the last tab');
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[0].getAttribute('aria-selected'), 'true', 'ArrowRight did not wrap to the first tab');
});

test('a key the pattern does not claim is left alone', () => {
  const root = mount(three());
  const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  act(() => { root.querySelector('[role="tablist"]').dispatchEvent(ev); });
  assert.equal(ev.defaultPrevented, false, 'Tabs cancelled a key it does not handle');
  assert.equal(tabsOf(root)[0].getAttribute('aria-selected'), 'true');
});

test('the selected tab and its panel reference each other in the real DOM', () => {
  const root = mount(three());
  const selected = tabsOf(root).find((t) => t.getAttribute('aria-selected') === 'true');
  const panel = panelOf(root);
  assert.equal(selected.getAttribute('aria-controls'), panel.getAttribute('id'));
  assert.equal(panel.getAttribute('aria-labelledby'), selected.getAttribute('id'));

  assert.equal(root.querySelector(`#${panel.getAttribute('id')}`), panel);
});

test('dropping a tab does not migrate a surviving panel\'s typed input into the wrong tab', () => {
  function IdentityHarness() {
    const [keys, setKeys] = React.useState(['a', 'b', 'c']);
    return (
      <>
        <button type="button" data-drop onClick={() => setKeys(['b', 'c'])}>drop</button>
        <Tabs defaultValue="b">
          {keys.map((k) => <Tab key={k} value={k} label={`Tab ${k}`}><input data-for={k} /></Tab>)}
        </Tabs>
      </>
    );
  }
  const root = mount(<IdentityHarness />);

  act(() => {
    for (const input of root.querySelectorAll('input[data-for]')) {
      input.value = `typed-${input.dataset.for}`;
    }
  });
  act(() => { root.querySelector('[data-drop]').click(); });

  const pairs = [...root.querySelectorAll('input[data-for]')]
    .map((input) => [input.dataset.for, input.value]);
  assert.deepEqual(pairs, [['b', 'typed-b'], ['c', 'typed-c']],
    'a surviving panel\'s input held another tab\'s typed value -- the panel list is keyed positionally');
});

test('the binding is honest: every `tabs` requirement, in both directions', () => {
  const root = mount(three());
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation', 'tabs', 'Tabs.behaviour.json'),
    subjects: {
      default: root.querySelector('[role="tablist"]'),
      'roles.tab': root.querySelector('[role="tab"]'),

      'roles.controls': [...root.querySelectorAll('[role="tab"]')],
      'states.selected': [...root.querySelectorAll('[role="tab"]')],
      'roles.tabpanel': root.querySelector('[role="tabpanel"]'),
    },

    behavioural: {
      'focus.roving': true,
      'keyboard.ArrowLeft': true,
      'keyboard.ArrowRight': true,
    },
  });
});

test('Tab binds "none" because Tabs owns the pattern, and it adds no affordance of its own', () => {
  const root = mount(three());
  const [first] = tabsOf(root);

  assert.equal(first.getAttribute('role'), 'tab',
    'the role a Tab carries is a clause of the `tabs` pattern Tabs binds -- the Tab does not choose it');
  assert.equal(first.hasAttribute('aria-haspopup'), false,
    'a Tab that grew an affordance of its own would need a pattern of its own, and its binding says it has none');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation/tab/Tab.behaviour.json'),
    subjects: { default: first },
  });
});
