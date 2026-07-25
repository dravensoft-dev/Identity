import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Button } from '../components/forms/Button.jsx';

test('Button renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Button>Deploy</Button>), /Deploy/);
});

/* Both icons are drawn from Phosphor class names now, and they must land on
 * DIFFERENT sides of the label. Asserting only that both classes appear would
 * pass against a component that rendered both leading, so the order of the
 * three fragments is what is asserted. */
test('Button draws icon before the label and iconRight after it', () => {
  const html = renderToStaticMarkup(
    <Button icon="ph-bold ph-plus" iconRight="ph-bold ph-caret-down">Deploy</Button>
  );
  assert.match(html, /ph-bold ph-plus[\s\S]*Deploy[\s\S]*ph-bold ph-caret-down/);
});

/* loading REPLACES the leading icon rather than sitting beside it, and the
 * spinner is the only element carrying the arena-btn-spin class. Asserting the
 * icon's absence is what discriminates replacement from addition. */
test('Button replaces the leading icon with the spinner while loading', () => {
  const html = renderToStaticMarkup(<Button icon="ph-bold ph-plus" loading>Deploy</Button>);
  assert.match(html, /arena-btn-spin/);
  assert.doesNotMatch(html, /ph-bold ph-plus/);
});

test('Button is disabled while loading, without being passed disabled', () => {
  assert.match(renderToStaticMarkup(<Button loading>Deploy</Button>), /disabled/);
});

test('Button defaults its native type to button and honours an override', () => {
  assert.match(renderToStaticMarkup(<Button>x</Button>), /type="button"/);
  assert.match(renderToStaticMarkup(<Button type="submit">x</Button>), /type="submit"/);
});

/* Danger is outline, never filled -- README's normative convention. The
 * assertion names the transparent background specifically, because asserting
 * only that --danger appears would also be satisfied by a filled danger
 * button, which is the exact thing the convention forbids. */
test('Button renders danger as outline, never filled', () => {
  const html = renderToStaticMarkup(<Button variant="danger">Delete</Button>);
  assert.match(html, /background:transparent/);
  assert.match(html, /var\(--danger\)/);
});

/* R4: the extends React.ButtonHTMLAttributes heritage clause and the {...rest}
 * spread both left this component, and `style` went with the heritage.
 * check:api reads the .d.ts and never opens the .jsx, so a test is the ONLY
 * regression guard. Asserted separately -- see Spinner. */
test('Button drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <Button style={{ color: '#ff00ff' }} data-stray="x">x</Button>
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

/* `tabStop` is the second global attribute Arena admits as a member, after
 * `id`, and it passes the same test api/README.md states for that one: the D1
 * flatten removed the capability, and there is no other surface a host can
 * write it on. Button's half of that reason is its own: Angular delegates it to
 * MatButton and there is no arena-button primitive -- behaviour-delegated.json
 * says Arena "should not grow one" -- so the rule's escape hatch, that a
 * consumer writes the attribute on the host, has no host to be written on.
 *
 * check:api reads the .d.ts and never opens the .jsx, so these three tests are
 * the ONLY guard that the attribute is really written. */
test('tabStop defaults to true and emits no tabindex at all', () => {
  const html = renderToStaticMarkup(<Button>Save</Button>);
  assert.doesNotMatch(html, /tabindex/i, 'a default Button wrote a tabindex it does not need');
});

test('tabStop={false} takes the control out of the page Tab sequence', () => {
  const html = renderToStaticMarkup(<Button tabStop={false}>Save</Button>);
  assert.match(html, /tabindex="-1"/, 'tabStop={false} did not write tabindex="-1"');
});

test('tabStop is not forwarded to the DOM as an unknown attribute', () => {
  const html = renderToStaticMarkup(<Button tabStop={false}>Save</Button>);
  assert.doesNotMatch(html, /tabstop/i, 'the tabStop prop leaked into the markup');
});
