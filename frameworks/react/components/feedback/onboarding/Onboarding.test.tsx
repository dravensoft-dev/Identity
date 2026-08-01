import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Onboarding } from './Onboarding.tsx';

import { sp3, sp4 } from '../../../Tokens.generated.js';

test('a closed tour renders nothing', () => {
  assert.equal(renderToStaticMarkup(<Onboarding open={false} steps={[{ title: 'One' }]} />), '');
});

test('a step draws its eyebrow, title and body as text, and names the dialog', () => {
  const html = renderToStaticMarkup(
    <Onboarding open steps={[{ eyebrow: 'TOUR', title: 'Projects', body: 'Everything lives here.' }]} />,
  );
  assert.ok(html.includes('TOUR'), 'the eyebrow is rendered');
  assert.ok(html.includes('Everything lives here.'), 'the body renders as plain text');
  assert.ok(html.includes('aria-label="Projects"'), 'the dialog-modal binding\'s accessible name is intact');
});

test('an anchor switches the coachmark from the bottom-right corner to top/left placement', () => {
  const floating = renderToStaticMarkup(<Onboarding open steps={[{ title: 'One' }]} />);
  const anchored = renderToStaticMarkup(
    <Onboarding open steps={[{ title: 'One' }]} anchor={{ left: sp4, bottom: sp3 }} />,
  );

  assert.ok(anchored.includes(';top:'), 'the anchored branch pins a computed top');
  assert.ok(anchored.includes(';left:'), 'the anchored branch pins a computed left');
  assert.ok(!floating.includes(';top:'), 'the default branch pins no top');
  assert.ok(floating.includes(';right:'), 'the default branch floats off the right edge instead');
});

test('an absent required member throws rather than rendering', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<Onboarding steps={[{ title: 'One' }]} />), /`open` is required/);
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<Onboarding open />), /`steps` is required/);
});
