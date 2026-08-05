/* The other half of the breakpoint question: arenaContainerWidth answers "how wide is this box",
 * which is what a component needs, and this answers "which side of the threshold is the
 * viewport on", which is what a consumer's own page layout needs and could not get from CSS,
 * since a media query condition holds no var(). The query is `not all and (min-width: N)`
 * rather than a max-width one short of N, so it is the exact complement of the `md:` variant
 * with no epsilon to get wrong. One probe per name because arenaViewportBelow takes its name at
 * construction, in an injection context, where an input signal has nothing in it yet.
 * The harness installs no stylesheet, so the thresholds are bridged from the generated CSS
 * rather than typed in here and left to drift. */

import { useTestEnvironment } from './TestbedEnv';
useTestEnvironment();

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ChangeDetectionStrategy, Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { REPO } from './Compliance';
import { forgetArenaBreakpoints, arenaViewportBelow } from '../ContainerSize';

const spacing = readFileSync(join(REPO, 'contracts', 'design-generated', 'spacing.generated.css'), 'utf8');
const installed: string[] = [];

before(() => {
  forgetArenaBreakpoints();
  for (const [, name, value] of spacing.matchAll(/(--bp-[a-z]+)\s*:\s*([^;]+);/g)) {
    document.documentElement.style.setProperty(name, value.trim());
    installed.push(name);
  }
});

after(() => {
  for (const name of installed) document.documentElement.style.removeProperty(name);
  forgetArenaBreakpoints();
});

interface Resizable { happyDOM: { setViewport(size: { width: number }): void } }

@Component({
  selector: 'arena-probe-sm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span [attr.data-below]="below()"></span>',
})
class SmallProbe { readonly below = arenaViewportBelow('sm'); }

@Component({
  selector: 'arena-probe-md',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span [attr.data-below]="below()"></span>',
})
class MediumProbe { readonly below = arenaViewportBelow('md'); }

@Component({
  selector: 'arena-probe-lg',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span [attr.data-below]="below()"></span>',
})
class LargeProbe { readonly below = arenaViewportBelow('lg'); }

async function probe(type: Type<unknown>, width: number) {
  const fixture = TestBed.createComponent(type);
  const host = fixture.nativeElement as Element;
  const view = host.ownerDocument.defaultView as unknown as Resizable;
  view.happyDOM.setViewport({ width });
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  const read = () => host.querySelector('span')!.getAttribute('data-below');
  return {
    read,
    resize: (next: number) => {
      view.happyDOM.setViewport({ width: next });
      fixture.detectChanges();
      return read();
    },
    destroy: () => fixture.destroy(),
  };
}

test('it reports which side of --bp-md the viewport is on, and follows a resize', async () => {
  const p = await probe(MediumProbe, 1280);
  try {
    assert.equal(p.read(), 'false', 'a desktop viewport is not below md');
    assert.equal(p.resize(390), 'true',
      'the signal must follow the resize, or a shell renders its wide branch on a phone that rotated');
    assert.equal(p.resize(1280), 'false');
  } finally { p.destroy(); }
});

test('the threshold itself is not below it, which is what the md: variant means', async () => {
  const p = await probe(MediumProbe, 768);
  try {
    assert.equal(p.read(), 'false',
      '--bp-md is the width at which the wide branch starts, so exactly 768 is the wide side');
  } finally { p.destroy(); }
});

test('each name is its own threshold', async () => {
  const cases: [Type<unknown>, string][] = [[SmallProbe, 'false'], [MediumProbe, 'true'], [LargeProbe, 'true']];
  for (const [type, expected] of cases) {
    const p = await probe(type, 600);
    try {
      assert.equal(p.read(), expected,
        '600 is above --bp-sm (480) and below both --bp-md (768) and --bp-lg (1024)');
    } finally { p.destroy(); }
  }
});
