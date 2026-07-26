import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tooltip } from '../components/feedback/Tooltip.jsx';

/* WHAT SSR CAN AND CANNOT SHOW HERE, because for this component the gap is wide.
 *
 * Tooltip mounts with `show` false, and TWO different things flip it: a mouseover
 * plus --delay-open, and a focus, which reveals IMMEDIATELY because the delays are
 * pointer intent and a keyboard user has already paid to reach the control. Both
 * need an event and a DOM. This directory renders with renderToStaticMarkup and
 * has neither, so a static render shows the TRIGGER and never the bubble. Nothing
 * below asserts the bubble's text, its role="tooltip", or either delay; that would
 * be asserting something false about a static render.
 * `frameworks/react/test-dom/tooltip-timer.test.jsx` owns the pointer reveal and
 * keeps owning it -- it drives real mouseover/mouseout against a real DOM and pins
 * the cancel-and-reschedule rule around --delay-open and --delay-close --
 * and `tooltip-keyboard.test.jsx` owns the focus path, the merged
 * aria-describedby and Escape.
 *
 * What IS verifiable statically is exactly what this migration changed:
 *
 *   The bubble became a PRIMITIVE. api/README.md settles the collision the binding
 *   table creates -- a component declaring both a `content` member and children has
 *   two candidates for one default slot, and the trigger is the one genuinely
 *   projected. So the trigger keeps `children` (contract slot `content`) and the
 *   bubble is the required string `label`. Arena draws the bubble; the consumer
 *   names it.
 *
 *   Required-ness governs runtime (Constraint 8), so a missing `label` fails hard
 *   rather than drawing an empty bubble later, on a pointer, where nobody is
 *   watching. The required SLOT takes no guard: compareSurface excludes slots from
 *   required-ness comparison, because Angular's <ng-content> cannot express it.
 *
 *   R4: `style` left the component, and there is no {...rest} to put it back. */

test('the trigger renders -- children are the projected element, not the bubble', () => {
  const html = renderToStaticMarkup(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  assert.match(html, /<button type="button">Hover<\/button>/, 'the trigger did not render');
  /* And the bubble is absent until a pointer rests: this is the static half of the
   * deferred affordance, not an oversight. */
  assert.doesNotMatch(html, /role="tooltip"/, 'the bubble rendered without pointer intent');
  assert.doesNotMatch(html, /Details/, 'the label rendered into the static markup with no pointer to reveal it');
});

test('a missing label throws rather than drawing an unnamed bubble', () => {
  assert.throws(
    () => renderToStaticMarkup(<Tooltip><button type="button">Hover</button></Tooltip>),
    /Tooltip: `label` is required/,
    'a Tooltip with no label rendered instead of failing hard',
  );
});

/* R4: asserted in two separate tests -- node:assert aborts on the first failure, so
 * one body asserting both escapes cannot say which of them came back. */
test('Tooltip drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Tooltip label="Details" style={{ color: '#ff00ff' }}><button type="button">Hover</button></Tooltip>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tooltip drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Tooltip label="Details" data-stray="x"><button type="button">Hover</button></Tooltip>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});
