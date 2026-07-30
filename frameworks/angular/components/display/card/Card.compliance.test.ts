/* `none` requires nothing, so assertPattern alone would pass over a card that had
 * grown a role or a tab stop of its own. What this suite states instead is the
 * claim the binding makes: everything pressable inside a card came from the
 * caller, and the header appears exactly when there is something to put in it. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { assertNoNode } from '../../../test/NodeAssert';
import { ArenaAction } from '../../../ProjectionMarkers';
import { Card } from './Card';
import { assertPattern, isFocusable, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'display/card/Card.behaviour.json');

@Component({
  standalone: true,
  imports: [Card, ArenaAction],
  template: `
    <arena-card [title]="title" [eyebrow]="eyebrow" [accent]="accent" [floating]="floating">
      @if (withAction) {
        <button action type="button">Open</button>
      }
      <p>Everything the client can see.</p>
    </arena-card>
  `,
})
class CardHost {
  title: string | undefined = 'Client Portal';
  eyebrow: string | undefined = 'Delivery';
  accent = false;
  floating = false;
  withAction = false;
}

function render(patch: Partial<CardHost> = {}) {
  const fixture = TestBed.createComponent(CardHost);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture;
}

test('arena-card is a surface: no role of its own, and nothing focusable it did not receive', () => {
  const fixture = render();
  try {
    const card = fixture.nativeElement.querySelector('arena-card') as HTMLElement;

    assert.equal(card.getAttribute('role'), null, 'a surface that claims a role claims an affordance it does not have');
    for (const el of [card, ...Array.from(card.querySelectorAll('*'))]) {
      assert.equal(isFocusable(el as Element), false,
        `<${el.tagName.toLowerCase()}> is reachable by keyboard, and the caller put nothing focusable in this card`);
    }

    assertPattern({
      root: card,
      bindingPath: BINDING,
      subjects: { default: card },
    });
  } finally {
    fixture.destroy();
  }
});

test('a control the caller projects stays reachable -- the card adds no affordance and takes none away', () => {
  const fixture = render({ withAction: true });
  try {
    const card = fixture.nativeElement.querySelector('arena-card') as HTMLElement;
    const action = card.querySelector('button');
    assert.ok(action, 'the [action] slot did not project the caller\'s button');
    assert.equal(isFocusable(action), true, 'the projected control lost its tab stop inside the card');
  } finally {
    fixture.destroy();
  }
});

test('the header renders for a title, for an eyebrow, or for an action alone, and for none of them it is absent', () => {
  const headed: Array<Partial<CardHost>> = [
    { title: 'Client Portal', eyebrow: undefined },
    { title: undefined, eyebrow: 'Delivery' },
    { title: undefined, eyebrow: undefined, withAction: true },
  ];
  for (const patch of headed) {
    const fixture = render(patch);
    try {
      const card = fixture.nativeElement.querySelector('arena-card') as HTMLElement;
      assert.ok(card.children.length > 1,
        `${JSON.stringify(patch)}: the header block did not render, so its content has nowhere to go`);
    } finally {
      fixture.destroy();
    }
  }

  const bare = render({ title: undefined, eyebrow: undefined });
  try {
    const card = bare.nativeElement.querySelector('arena-card') as HTMLElement;
    assert.equal(card.children.length, 1, 'a card with nothing to head still drew a header block');
    assertNoNode(card.querySelector('arena-card > div > div'), 'the empty header survived as a nested block');
  } finally {
    bare.destroy();
  }
});

test('accent and floating reach the host, which is the styled element because the root slot is host-bound', () => {
  const plain = render();
  const marked = render({ accent: true, floating: true });
  try {
    const plainClass = (plain.nativeElement.querySelector('arena-card') as HTMLElement).getAttribute('class') ?? '';
    const markedClass = (marked.nativeElement.querySelector('arena-card') as HTMLElement).getAttribute('class') ?? '';
    assert.notEqual(plainClass, markedClass, 'accent and floating changed nothing on the host');
    assert.match(markedClass, /\bborder-primary\b/, 'accent did not draw the border in the accent colour');
    assert.match(markedClass, /\bshadow-2\b/, 'floating did not cast the warm shadow');
    assert.doesNotMatch(plainClass, /\bshadow-2\b/);
  } finally {
    plain.destroy();
    marked.destroy();
  }
});
