/*
 * happy-dom has no layout, so both boxes are stubbed: the SVG's left edge and the
 * overlay rect's, which differ by PAD.l exactly as they do in a browser. The series is
 * thirteen points on purpose -- the interval is then 45.67px, narrower than the 44px
 * shift, so measuring against the rect selects the PREVIOUS point. At five points the
 * interval is 137px and the same defect changes no verdict at all.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.tsx';
import { PAD } from '../../../DataVisuals.ts';
import { ArenaLineChart } from './ArenaLineChart.tsx';

const VALUES = [120, 138, 131, 144, 127, 150, 133, 141, 126, 148, 139, 130, 145];
const LABELS = VALUES.map((_, i) => `p${i}`);
const WIDTH = 600;
const SVG_LEFT = 100;

const IW = WIDTH - PAD.l - PAD.r;
const xOf = (i: number) => PAD.l + (IW / (VALUES.length - 1)) * i;

afterEach(cleanup);

const edgeAt = (left: number) => () => ({ left });

function stubBoxes(root: ParentNode) {
  const svg = root.querySelector('svg');
  const overlay = root.querySelector('rect[fill="transparent"]');
  svg!.getBoundingClientRect = edgeAt(SVG_LEFT) as () => DOMRect;
  overlay!.getBoundingClientRect = edgeAt(SVG_LEFT + PAD.l) as () => DOMRect;
  Object.defineProperty(overlay, 'ownerSVGElement', { value: svg, configurable: true });
  return overlay;
}

function crosshairX(root: ParentNode) {
  const dashed = [...root.querySelectorAll('line')].find((l) => l.getAttribute('stroke-dasharray'));
  return dashed && Number(dashed.getAttribute('x1'));
}

function hoverAt(overlay: Element, clientX: number) {
  act(() => {
    overlay.dispatchEvent(new window.MouseEvent('mousemove', { clientX, bubbles: true }));
  });
}

test('the pointer and the plot share the SVG origin, so a pointer on a point snaps to that point', () => {
  const root = mount(<ArenaLineChart seriesLabel="p95" labels={LABELS} values={VALUES} />);
  const overlay = stubBoxes(root);

  for (let i = 0; i < VALUES.length; i++) {
    hoverAt(overlay!, SVG_LEFT + xOf(i));
    assert.equal(crosshairX(root), xOf(i),
      `a pointer sitting exactly on point ${i} selected another point -- the two origins differ by PAD.l`);
  }
});

test('the interval is narrower than the left pad, so the wrong origin would be visible', () => {
  const step = IW / (VALUES.length - 1);
  assert.ok(step < PAD.l * 2,
    `this fixture cannot see the defect: an interval of ${step}px absorbs a ${PAD.l}px shift`);
});
