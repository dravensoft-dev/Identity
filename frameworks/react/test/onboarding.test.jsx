import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Onboarding } from '../components/feedback/Onboarding.jsx';
// sp3/sp4 stand in for two arbitrary viewport coordinates below -- not the
// values' design meaning, just real numbers pulled from a token rather than
// bare literals, which check:dimensions governs at `left`/`bottom` the same
// as any other framework source under `frameworks/`.
import { sp3, sp4 } from '../tokens.generated.js';

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

test('an anchor of two plain numbers positions the coachmark', () => {
  const html = renderToStaticMarkup(
    <Onboarding open steps={[{ title: 'One' }]} anchor={{ left: sp4, bottom: sp3 }} />,
  );
  assert.ok(html.includes('position:fixed'), 'the anchored branch renders a fixed-position coachmark');
});
