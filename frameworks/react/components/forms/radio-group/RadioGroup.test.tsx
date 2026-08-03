import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { RadioGroup } from './RadioGroup.tsx';
import { Radio } from '../radio/Radio.tsx';

const LABEL = 'Deployment target';

test('RadioGroup marks the child whose value matches, and only it', () => {
  const html = renderToStaticMarkup(
    <RadioGroup ariaLabel={LABEL} value="b"><Radio value="a" label="A" /><Radio value="b" label="B" /></RadioGroup>,
  );

  assert.equal(html.match(/class="size-2\.5 rounded-pill bg-primary"/g)?.length, 1,
    'the filled dot is drawn once, on the child whose value matches');
  assert.equal(html.match(/\bborder-primary\b/g)?.length, 1, 'and one ring takes the accent border');
});

test('RadioGroup gives its children a shared name so the native radios group', () => {
  const html = renderToStaticMarkup(
    <RadioGroup ariaLabel={LABEL} name="env"><Radio value="a" label="A" /><Radio value="b" label="B" /></RadioGroup>,
  );
  assert.equal(html.match(/name="env"/g)?.length, 2);
});

test('Radio renders its label and hint', () => {
  const html = renderToStaticMarkup(<RadioGroup ariaLabel={LABEL}><Radio value="a" label="Prod" hint="Real users" /></RadioGroup>);
  assert.match(html, /Prod/);
  assert.match(html, /Real users/);
});

test('Radio throws when value is absent -- the fail-hard guard', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<RadioGroup ariaLabel={LABEL}><Radio label="A" /></RadioGroup>),
    /Radio: `value` is required/,
  );
});

test('RadioGroup drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    <RadioGroup ariaLabel={LABEL} style={{ color: '#ff00ff' }}><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('RadioGroup drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(
    <RadioGroup ariaLabel={LABEL} data-stray="x"><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

test('RadioGroup throws when ariaLabel is absent -- each option names itself, the SET names nothing', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<RadioGroup><Radio value="a" label="A" /></RadioGroup>),
    /RadioGroup: `ariaLabel` is required/,
  );
});

test('ariaLabel names the group, and `name` is not a label', () => {
  const html = renderToStaticMarkup(
    <RadioGroup ariaLabel={LABEL} name="env"><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.match(html, new RegExp(`<div role="radiogroup" aria-label="${LABEL}"`));
  assert.doesNotMatch(html, /aria-label="env"/, 'the form name must never reach a screen reader as the name');
});

test('the group draws its own column from Radio\'s manifest, which is the surface it belongs to', () => {
  const html = renderToStaticMarkup(
    <RadioGroup ariaLabel={LABEL}><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.match(html, /<div role="radiogroup"[^>]*class="flex flex-col gap-3"/,
    'RadioGroup carries no manifest of its own because it has no surface of its own');
});

test('the ring finds its own focus, so nothing injects a stylesheet to reach the input', () => {
  const html = renderToStaticMarkup(
    <RadioGroup ariaLabel={LABEL}><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.match(html, /has\(~input:focus-visible\)/);
  assert.doesNotMatch(html, /\barena-radio-ring\b/, 'the hook class the injected sheet needed is gone with it');
});
