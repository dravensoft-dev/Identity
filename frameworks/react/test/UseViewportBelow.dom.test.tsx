/* The other half of the breakpoint question: useArenaContainerWidth answers "how wide is this box",
 * which is what a component needs, and this answers "which side of the threshold is the
 * viewport on", which is what a consumer's own page layout needs and could not get from CSS,
 * since a media query condition holds no var(). The query is `not all and (min-width: N)`
 * rather than a max-width one short of N, so it is the exact complement of the `md:` variant
 * with no epsilon to get wrong. happy-dom evaluates matchMedia against its own viewport. */
import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from './Harness.tsx';
import { forgetArenaBreakpoints, useArenaViewportBelow } from '../UseArenaContainerWidth.ts';

afterEach(cleanup);
after(forgetArenaBreakpoints);

function Probe({ name }: { name: 'sm' | 'md' | 'lg' }) {
  return <span data-below={String(useArenaViewportBelow(name))} />;
}

function viewport(width: number) {
  act(() => {
    (window as unknown as { happyDOM: { setViewport(size: { width: number }): void } })
      .happyDOM.setViewport({ width });
  });
}

test('it reports which side of --bp-md the viewport is on, and follows a resize', () => {
  viewport(1280);
  const root = mount(<Probe name="md" />);
  assert.equal(root.firstElementChild!.getAttribute('data-below'), 'false',
    'a desktop viewport is not below md');

  viewport(390);
  assert.equal(root.firstElementChild!.getAttribute('data-below'), 'true',
    'the hook must follow the resize, or a shell renders its wide branch on a phone that rotated');

  viewport(1280);
  assert.equal(root.firstElementChild!.getAttribute('data-below'), 'false');
});

test('the threshold itself is not below it, which is what the md: variant means', () => {
  viewport(768);
  const root = mount(<Probe name="md" />);
  assert.equal(root.firstElementChild!.getAttribute('data-below'), 'false',
    '--bp-md is the width at which the wide branch starts, so exactly 768 is the wide side');
});

test('each name is its own threshold', () => {
  viewport(600);
  const root = mount(<><Probe name="sm" /><Probe name="md" /><Probe name="lg" /></>);
  assert.deepEqual(
    [...root.querySelectorAll('span')].map((el) => el.getAttribute('data-below')),
    ['false', 'true', 'true'],
    '600 is above --bp-sm (480) and below both --bp-md (768) and --bp-lg (1024)',
  );
});
