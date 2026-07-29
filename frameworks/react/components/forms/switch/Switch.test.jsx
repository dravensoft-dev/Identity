import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Switch } from '../components/forms/Switch.jsx';

test('on renders iconOn and aria-checked="true"', () => {
  const html = renderToStaticMarkup(<Switch state iconOn="ph-bold ph-sun" iconOff="ph-bold ph-moon" label="Dark theme" />);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /ph-bold ph-sun/);
  assert.doesNotMatch(html, /ph-bold ph-moon/);
});

test('off renders iconOff and aria-checked="false"', () => {
  const html = renderToStaticMarkup(<Switch state={false} iconOn="ph-bold ph-sun" iconOff="ph-bold ph-moon" label="Dark theme" />);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /ph-bold ph-moon/);
  assert.doesNotMatch(html, /ph-bold ph-sun/);
});

/* renderToStaticMarkup cannot dispatch a click, so activation is reached the
 * one other way a function component allows: call the component and read the
 * onClick off the element it returned — the same technique side-nav.test.jsx
 * uses for the same reason. */
test('confirm routes a click to onRequestChange and does not fire onFuncOn', () => {
  const seen = [];
  const tree = Switch({
    state: false, confirm: true, label: 'x',
    onRequestChange: () => seen.push('requestChange'),
    onFuncOn: () => seen.push('funcOn'),
    onFuncOff: () => seen.push('funcOff'),
  });
  const [button] = tree.props.children;
  button.props.onClick();
  assert.deepEqual(seen, ['requestChange']);
});

test('a plain click fires onFuncOn when off and onFuncOff when on', () => {
  const seenOff = [];
  const treeOff = Switch({ state: false, label: 'x', onFuncOn: () => seenOff.push('on'), onFuncOff: () => seenOff.push('off') });
  treeOff.props.children[0].props.onClick();
  assert.deepEqual(seenOff, ['on']);

  const seenOn = [];
  const treeOn = Switch({ state: true, label: 'x', onFuncOn: () => seenOn.push('on'), onFuncOff: () => seenOn.push('off') });
  treeOn.props.children[0].props.onClick();
  assert.deepEqual(seenOn, ['off']);
});

test('disabled ignores the click entirely', () => {
  const seen = [];
  const tree = Switch({ state: false, disabled: true, label: 'x', onFuncOn: () => seen.push('on') });
  tree.props.children[0].props.onClick();
  assert.deepEqual(seen, []);
});

test('orientation and size render without error', () => {
  for (const orientation of ['horizontal', 'vertical']) {
    for (const size of ['sm', 'md', 'lg', 'xl', '2xl']) {
      const html = renderToStaticMarkup(<Switch state orientation={orientation} size={size} label="x" />);
      assert.match(html, /role="switch"/);
    }
  }
});
