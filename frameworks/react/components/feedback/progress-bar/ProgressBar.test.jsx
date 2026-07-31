import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ProgressBar } from './ProgressBar.jsx';

test('progressPercentage drives the fill width and aria-valuenow', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Deploying" progressPercentage={64} />);
  assert.match(html, /aria-valuenow="64"/);
  assert.match(html, /width:64%/, 'the fill was not drawn at the given percentage');
});

test('progressPercentage above 100 is clamped to 100', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Uploading build" progressPercentage={150} />);
  assert.match(html, /aria-valuenow="100"/);
  assert.match(html, /width:100%/);
  assert.doesNotMatch(html, /150/, 'the out-of-range percentage reached the page unclamped');
});

test('progressPercentage below 0 is clamped to 0', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Uploading build" progressPercentage={-20} />);
  assert.match(html, /aria-valuenow="0"/);
  assert.match(html, /width:0%/);
  assert.doesNotMatch(html, /-20/, 'the out-of-range percentage reached the page unclamped');
});

test('indeterminate ignores progressPercentage: no fill, no aria-valuenow', () => {
  const html = renderToStaticMarkup(<ProgressBar indeterminate label="Connecting" progressPercentage={64} />);
  assert.doesNotMatch(html, /aria-valuenow/, 'an indeterminate bar reported a value');
  assert.doesNotMatch(html, /width:64%/, 'an indeterminate bar drew a fill from progressPercentage');

  assert.match(html, /class="arena-prog-ind"/);
});

test('showPercentage governs the VISIBLE number only, and never the one the live region announces', () => {
  const count = (html) => html.split('>64%<').length - 1;

  const shown = renderToStaticMarkup(<ProgressBar label="Deploying" progressPercentage={64} />);
  assert.equal(count(shown), 2, 'by default the percentage is drawn beside the label and announced inside the region');

  const hidden = renderToStaticMarkup(<ProgressBar label="Deploying" progressPercentage={64} showPercentage={false} />);
  assert.equal(count(hidden), 1,
    'showPercentage={false} is a visual choice: it drops the number beside the label and must leave the '
    + 'announcement inside the live region, which is the only content change a screen reader has to report');
  assert.match(hidden, />Deploying</, 'showPercentage={false} also removed the label');
});

test('showPercentage draws nothing in indeterminate mode -- there is no percentage to show', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Connecting" indeterminate showPercentage />);
  assert.doesNotMatch(html, /%</, 'an indeterminate bar drew a percentage');
});

test('label is drawn above the bar AND is the bar aria-label', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Deploying build #4821" progressPercentage={10} />);
  assert.match(html, />Deploying build #4821</, 'the label was not drawn');
  assert.match(html, /aria-label="Deploying build #4821"/, 'the label did not become the accessible name');
  assert.doesNotMatch(html, /aria-label="Progress"/, 'a labelled bar still fell back to the generic name');
});

test('an absent label throws rather than falling back to a name that says only what the component is', () => {
  assert.throws(
    () => renderToStaticMarkup(<ProgressBar progressPercentage={10} />),
    /`label` is required/,
    'a generic fallback satisfies roles.label mechanically and tells a screen-reader user nothing',
  );
  const html = renderToStaticMarkup(<ProgressBar label="Uploading build" progressPercentage={10} />);
  assert.match(html, /aria-label="Uploading build"/);
});

test('every tone reaches the bar as its own token', () => {
  const expected = {
    accent: 'var(--crimson)', gold: 'var(--gold)', success: 'var(--success)',
    danger: 'var(--danger)', info: 'var(--info)',
  };
  for (const [tone, token] of Object.entries(expected)) {
    const html = renderToStaticMarkup(<ProgressBar label="Uploading build" tone={tone} progressPercentage={50} />);
    assert.ok(html.includes(token), `tone="${tone}" did not reach the bar as ${token}`);
  }

  assert.ok(renderToStaticMarkup(<ProgressBar label="Uploading build" progressPercentage={50} />).includes('var(--crimson)'));
});

test('ProgressBar drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Uploading build" progressPercentage={50} style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('ProgressBar drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Uploading build" progressPercentage={50} data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});
