/* arena-alert binds its host role conditionally:
 *   '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"
 * and alert.behaviour.json excepts `roles.element` saying exactly that. A text
 * scan reads the string 'alert' in the source and calls the requirement met,
 * which retires a true exception -- the exact failure mode the spec's proposed
 * scan was measured against and cut for. Rendering once per tone settles it, and
 * settles it in the only way that can be settled: the value differs per render,
 * not per file.
 *
 * It is also why Angular's three ways of authoring an attribute -- a template
 * literal, `[attr.role]`, and a `host` object entry, all three of which this
 * component uses -- are invisible to the shared evaluator. In a rendered tree
 * they are one attribute.
 *
 * The input is driven by overwriting the instance field before the first
 * `detectChanges()`, not by `componentRef.setInput()`. This harness runs
 * `@angular/compiler`'s JIT and never `ngtsc`, so a signal input never reaches
 * `ɵcmp.inputs` -- but the two failure modes are NOT the same, and the
 * difference is the reason this file does not use `setInput()`: a template
 * binding throws NG0303, while `setInput()` on the same undiscovered input
 * does not throw at all -- it silently no-ops and the render keeps the
 * field's default (confirmed by hand: `setInput('tone', 'danger')` against
 * this component prints the NG0303 message to console but leaves `role`
 * at `status`, the default tone's role). The throw is the safe failure --
 * it stops the test file from loading. The no-op is the dangerous one: a
 * future suite that called `setInput()` here would render, assert, and pass
 * VACUOUSLY against the default tone with no signal anything was wrong.
 * onboarding-focus-trap.test.ts's header states this correctly; this file
 * copies that finding rather than the template-binding half of it. What
 * overwriting the field buys and what it costs are otherwise the same as
 * host-class-binding.test.ts's header describes for `renderAppLogo` /
 * `renderActivityFeed`, the established shape this copies: the REAL
 * component, the REAL compiled template and REAL change detection, but
 * nothing about the input CONTRACT -- `bun run check:angular`'s
 * `ngc --strictTemplates` is the authority for that. */
import { useTestEnvironment } from './testbed-env';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
// @ts-expect-error -- a plain .mjs helper with JSDoc types only; see compliance.ts.
import { isFocusable } from '../../../scripts/lib/behaviour-compliance.mjs';
import { Alert } from '../primitives/alert/alert';
import { assertPattern, ANGULAR_PRIMITIVES } from './compliance';
const BINDING = join(ANGULAR_PRIMITIVES, 'alert/alert.behaviour.json');

/** Every tone `alert.ts`'s own `Tone` union admits. `info` is the default. */
const TONES = ['info', 'success', 'warning', 'danger', 'neutral'] as const;

function renderAlert(tone: (typeof TONES)[number]) {
  const fixture = TestBed.createComponent(Alert);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['tone'] = () => tone;
  fixture.detectChanges();
  return fixture;
}

test('arena-alert exposes role=alert only for the danger tone -- every other tone is the politer role=status', () => {
  const seen: Record<string, string | null> = {};
  for (const tone of TONES) {
    const fixture = renderAlert(tone);
    try {
      seen[tone] = (fixture.nativeElement as Element).getAttribute('role');
    } finally {
      fixture.destroy();
    }
  }
  assert.deepEqual(seen, {
    info: 'status',
    success: 'status',
    warning: 'status',
    danger: 'alert',
    neutral: 'status',
  });
});

/* `focus.unaffected` -- "an alert must not receive or move keyboard focus" --
 * is BEHAVIOURAL in the shared evaluator, so a suite must act on the tree rather
 * than read one element. Two things are asserted, because the requirement is two
 * claims: the host itself cannot take focus (no tabindex, and `<arena-alert>` is
 * not a natively focusable tag), and mounting one does not move focus away from
 * wherever it already was. The second is the half a snapshot cannot see. */
test('arena-alert neither takes focus nor moves it -- focus.unaffected, proved by acting on the tree', () => {
  const anchor = document.createElement('button');
  document.body.appendChild(anchor);
  try {
    anchor.focus();
    assert.equal(document.activeElement, anchor, 'sanity: focus starts on the anchor button');

    const fixture = renderAlert('danger');
    try {
      const host = fixture.nativeElement as Element;

      assert.equal(host.getAttribute('tabindex'), null, 'an alert must not be placed in the tab order');
      assert.equal(isFocusable(host), false, 'an alert host must not be able to take focus');
      assert.equal(
        document.activeElement,
        anchor,
        'rendering an alert must not steal focus from whatever the user was on',
      );
    } finally {
      fixture.destroy();
    }
  } finally {
    // On the shared document (testbed-env.ts) an undestroyed fixture is not the
    // only thing that would outlive this test -- this anchor would too, and it
    // is exactly the kind of stray focusable element the assertion above is
    // checking for. A failed assertion must not leave it behind for the next file.
    anchor.remove();
  }
});

/* `content.noAutoDismiss` -- "an alert must not disappear on a timer" -- is a
 * claim about the passage of time, which is why the evaluator returns null for it
 * and a suite has to act rather than read.
 *
 * Waiting is not the way to act on it. The shortest value the system would use to
 * retire a transient notice is `--dismiss-default`, 4200ms (tokens/src/behaviour.
 * json), and a suite that sat out 4.2 real seconds would still only have proved
 * the alert outlived *that* timer. So this fires the clock forward instead: every
 * callback scheduled while the alert is constructed and first rendered is
 * captured, then invoked immediately, regardless of the delay it asked for. That
 * is strictly stronger than waiting -- a 4.2s dismissal and a 0ms one are treated
 * the same -- and it costs milliseconds.
 *
 * Counting the schedule calls and asserting zero was tried first and is WRONG
 * here: Angular's own zoneless change detection schedules a `setTimeout` and a
 * `requestAnimationFrame` per render, so the count is never zero and says nothing
 * about the component. What matters is not that nothing was scheduled but that
 * nothing scheduled takes the alert away.
 *
 * The `dismissible` branch is the one rendered, since a hypothetical auto-dismiss
 * would live beside the manual one. */
test('arena-alert survives every timer its own render schedules, fired early -- content.noAutoDismiss', () => {
  const globals = globalThis as unknown as Record<string, unknown>;
  const names = ['setTimeout', 'setInterval', 'requestAnimationFrame'] as const;
  const saved = new Map<string, unknown>(names.map((n) => [n, globals[n]]));
  const captured: (() => void)[] = [];

  for (const name of names) {
    const original = saved.get(name);
    if (typeof original !== 'function') continue;
    globals[name] = (callback: unknown, ...rest: unknown[]) => {
      if (typeof callback === 'function') captured.push(() => (callback as (...a: unknown[]) => void)(0));
      return (original as (...a: unknown[]) => unknown)(callback, ...rest);
    };
  }

  let fixture;
  try {
    fixture = TestBed.createComponent(Alert);
    const instance = fixture.componentInstance as unknown as Record<string, unknown>;
    instance['tone'] = () => 'danger';
    instance['dismissible'] = () => true;
    fixture.detectChanges();
  } finally {
    for (const [name, original] of saved) globals[name] = original;
  }

  try {
    const host = fixture!.nativeElement as Element;
    assert.ok(host.querySelector('button[aria-label="Dismiss"]'), 'the dismissible branch should have rendered');
    assert.ok(captured.length > 0, 'sanity: a real render does schedule something -- Angular\'s own scheduler does');

    for (const fire of captured) fire();
    fixture!.detectChanges();

    // Still here, role intact, dismiss control intact. An alert goes away when the
    // consumer acts on `closed`, never on its own clock.
    assert.equal(host.getAttribute('role'), 'alert', 'the alert must still be a live region after every timer has fired');
    assert.ok(
      host.querySelector('button[aria-label="Dismiss"]'),
      'the alert must still be rendered after every timer it scheduled has fired',
    );
  } finally {
    fixture!.destroy();
  }
});

/* The binding is asserted on a NON-danger tone, and the tone is the whole point.
 *
 * `alert.behaviour.json` excepts `roles.element` because the role is `alert` only
 * when the tone is danger. That exception is FALSE of the danger render -- run
 * this against `tone="danger"` and the comparison correctly reports STALE
 * EXCEPTION, because for that one branch the component does meet the pattern.
 * It is TRUE of the default tone and of the three other non-danger ones, which
 * are what the reason string on file describes in as many words.
 *
 * So this asserts the branch the exception is about, exactly as React's Skeleton
 * suite asserts the `circle` variant its own two exceptions describe. And it
 * leaves behind the same recorded gap: a binding is per component, so it cannot
 * say "true in one branch, false in another", and a reader of alert.behaviour.
 * json alone would conclude the alert role is never reached. The reason string
 * carries that scoping in prose only. That is the schema limitation the spec
 * records as open for Tag, one level down -- a requirement, rather than a whole
 * pattern, applying only sometimes. */
test('arena-alert matches its alert binding on the default tone, which is the branch the exception describes', () => {
  const fixture = renderAlert('info');
  try {
    assertPattern({
      root: fixture.nativeElement as Element,
      bindingPath: BINDING,
      behavioural: { 'focus.unaffected': true, 'content.noAutoDismiss': true },
    });
  } finally {
    fixture.destroy();
  }
});

