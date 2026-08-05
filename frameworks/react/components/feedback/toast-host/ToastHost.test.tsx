/* Every assertion reads the rendered class list, never a "name: value" string. A test that
 * spelt one out would itself be a bare dimension literal under frameworks/, and
 * check:dimensions reads this file too; the edge names below are class prefixes, not lengths. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ToastHost } from './ToastHost.tsx';
import { Toast } from '../toast/Toast.tsx';
import type { ArenaToastPlacement } from '../../../Api.generated';

const PLACEMENTS = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

const BLOCK = ['top', 'bottom'] as const;
const INLINE = ['start', 'end'] as const;

function classesOf(html: string): string[] {
  return (/class="([^"]*)"/.exec(html)?.[1] ?? '').split(/\s+/).filter(Boolean);
}

function pinnedOf(placement: ArenaToastPlacement): { block: string[]; inline: string[] } {
  const drawn = classesOf(renderToStaticMarkup(<ToastHost placement={placement} />));
  return {
    block: BLOCK.filter((edge) => drawn.some((c) => c.includes(`--placement-${edge}-`))),
    inline: INLINE.filter((edge) => drawn.some((c) => /--placement-/.test(c) && c.endsWith(`-${edge}`))),
  };
}

test('every placement pins one block edge and one inline edge, and it is the pair its own name states', () => {
  const expected = {
    'top-start': { block: ['top'], inline: ['start'] },
    'top-end': { block: ['top'], inline: ['end'] },
    'bottom-start': { block: ['bottom'], inline: ['start'] },
    'bottom-end': { block: ['bottom'], inline: ['end'] },
  } as const;
  for (const placement of PLACEMENTS) {
    assert.deepEqual(pinnedOf(placement), expected[placement],
      `${placement} pinned the wrong edges, or pinned both ends of an axis, which stretches the stack`);
  }
});

test('the default placement is bottom-end, matching the contract', () => {
  assert.equal(renderToStaticMarkup(<ToastHost />), renderToStaticMarkup(<ToastHost placement="bottom-end" />));
});

test('a bottom placement clears the device inset and a top one clears its own, and neither retypes a number', () => {
  const bottom = classesOf(renderToStaticMarkup(<ToastHost placement="bottom-end" />));
  const top = classesOf(renderToStaticMarkup(<ToastHost placement="top-end" />));
  assert.ok(bottom.includes('arena-toast-host__root--placement-bottom-end'),
    'a bottom placement takes the branch that clears the bottom inset');
  assert.ok(top.includes('arena-toast-host__root--placement-top-end'),
    'a top placement takes the branch that clears its own inset instead');
  assert.ok(!top.includes('arena-toast-host__root--placement-bottom-end'),
    'and neither branch leaks the other, which is what would pin both ends of the axis');
});

test('the root draws its own box, which is the fixing, the column and the z-slot a Toast cannot do for itself', () => {
  const drawn = classesOf(renderToStaticMarkup(<ToastHost />));
  assert.ok(drawn.includes('arena-toast-host__root'),
    'a static box ignores z-index entirely, which is what the root slot exists to fix');
  assert.ok(drawn.includes('arena-toast-host__root--placement-bottom-end'));
  assert.equal(drawn.length, 2, `the root draws its base and one placement branch, got: ${drawn.join(' ')}`);
});

test('the notices come out in the order they went in, so the reading order is the visual order', () => {
  const html = renderToStaticMarkup(
    <ToastHost>
      <Toast title="First" />
      <Toast title="Second" />
    </ToastHost>);
  assert.ok(html.indexOf('First') < html.indexOf('Second'),
    'the stack reversed its children -- the newest would be read last and shown first');
});

test('ToastHost neither counts its children nor caps them -- the queue that raised them owns that', () => {
  const many = Array.from({ length: 9 }, (_, i) => <Toast key={i} title={`Notice ${i}`} />);
  const html = renderToStaticMarkup(<ToastHost>{many}</ToastHost>);
  for (let i = 0; i < 9; i += 1) {
    assert.ok(html.includes(`Notice ${i}`), `notice ${i} was dropped -- ToastHost applied a ceiling of its own`);
  }
});

test('ToastHost drops a consumer style object and a consumer attribute -- no R4 escape reaches the root', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const styled = renderToStaticMarkup(<ToastHost style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(styled, /#ff00ff/, 'a consumer style reached the rendered root');
  const spread = renderToStaticMarkup(<ToastHost data-stray="x" />);
  assert.doesNotMatch(spread, /data-stray/, 'a consumer attribute reached the rendered root');
});

test('an unknown placement falls back to the default rather than rendering an unpinned box', () => {
  assert.deepEqual(pinnedOf('corner' as ArenaToastPlacement), { block: ['bottom'], inline: ['end'] },
    'a variant key the manifest does not declare resolves to no classes at all, so the guard '
    + 'that answers it is derived from the manifest rather than written out beside it');
});
