import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ProgressBar } from './ProgressBar.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so nothing here
 * observes the indeterminate sweep -- that is a keyframe animation on an injected
 * class, and useEffect does not run under SSR. What IS verified is everything the
 * static markup can decide: the clamp, the fill, the percentage's two modes, the
 * tone map, and -- the point of this migration -- that `label` is the bar's
 * accessible name rather than a node that degraded it to the literal "Progress".
 *
 * React's SSR does not emit attributes in source order, so nothing below assumes
 * adjacency between two attributes. */

test('progressPercentage drives the fill width and aria-valuenow', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Deploying" progressPercentage={64} />);
  assert.match(html, /aria-valuenow="64"/);
  assert.match(html, /width:64%/, 'the fill was not drawn at the given percentage');
});

test('progressPercentage above 100 is clamped to 100', () => {
  const html = renderToStaticMarkup(<ProgressBar progressPercentage={150} />);
  assert.match(html, /aria-valuenow="100"/);
  assert.match(html, /width:100%/);
  assert.doesNotMatch(html, /150/, 'the out-of-range percentage reached the page unclamped');
});

test('progressPercentage below 0 is clamped to 0', () => {
  const html = renderToStaticMarkup(<ProgressBar progressPercentage={-20} />);
  assert.match(html, /aria-valuenow="0"/);
  assert.match(html, /width:0%/);
  assert.doesNotMatch(html, /-20/, 'the out-of-range percentage reached the page unclamped');
});

test('indeterminate ignores progressPercentage: no fill, no aria-valuenow', () => {
  const html = renderToStaticMarkup(<ProgressBar indeterminate label="Connecting" progressPercentage={64} />);
  assert.doesNotMatch(html, /aria-valuenow/, 'an indeterminate bar reported a value');
  assert.doesNotMatch(html, /width:64%/, 'an indeterminate bar drew a fill from progressPercentage');
  /* The sweep is a class the injected stylesheet animates, not a rendered child. */
  assert.match(html, /class="arena-prog-ind"/);
});

test('showPercentage draws the number in determinate mode and is silent when false', () => {
  const shown = renderToStaticMarkup(<ProgressBar label="Deploying" progressPercentage={64} />);
  assert.match(shown, />64%</, 'the percentage was not drawn beside the label by default');
  const hidden = renderToStaticMarkup(<ProgressBar label="Deploying" progressPercentage={64} showPercentage={false} />);
  assert.doesNotMatch(hidden, />64%</, 'showPercentage={false} still drew the percentage');
  assert.match(hidden, />Deploying</, 'showPercentage={false} also removed the label');
});

test('showPercentage draws nothing in indeterminate mode -- there is no percentage to show', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Connecting" indeterminate showPercentage />);
  assert.doesNotMatch(html, /%</, 'an indeterminate bar drew a percentage');
});

/* EI: `label` is a primitive string precisely so it can be BOTH the visible line and
 * the accessible name. The previous node-valued member ran through
 * `typeof label === 'string' ? label : 'Progress'`, so any node degraded the bar's
 * name to a literal that names nothing. This is the assertion that would have caught it. */
test('label is drawn above the bar AND is the bar aria-label', () => {
  const html = renderToStaticMarkup(<ProgressBar label="Deploying build #4821" progressPercentage={10} />);
  assert.match(html, />Deploying build #4821</, 'the label was not drawn');
  assert.match(html, /aria-label="Deploying build #4821"/, 'the label did not become the accessible name');
  assert.doesNotMatch(html, /aria-label="Progress"/, 'a labelled bar still fell back to the generic name');
});

test('an absent label falls back to a generic name rather than leaving the bar unnamed', () => {
  const html = renderToStaticMarkup(<ProgressBar progressPercentage={10} />);
  assert.match(html, /aria-label="Progress"/, 'a bar with no label was left with no accessible name');
});

test('every tone reaches the bar as its own token', () => {
  const expected = {
    accent: 'var(--crimson)', gold: 'var(--gold)', success: 'var(--success)',
    danger: 'var(--danger)', info: 'var(--info)',
  };
  for (const [tone, token] of Object.entries(expected)) {
    const html = renderToStaticMarkup(<ProgressBar tone={tone} progressPercentage={50} />);
    assert.ok(html.includes(token), `tone="${tone}" did not reach the bar as ${token}`);
  }
  /* And the default is accent, not the first key of some other map. */
  assert.ok(renderToStaticMarkup(<ProgressBar progressPercentage={50} />).includes('var(--crimson)'));
});

/* R4: `style` left the component, and there is no {...rest} to put it back. Asserted in
 * two separate tests -- node:assert aborts on the first failure, so one body asserting
 * both escapes cannot say which of them came back. */
test('ProgressBar drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(<ProgressBar progressPercentage={50} style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('ProgressBar drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<ProgressBar progressPercentage={50} data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});
