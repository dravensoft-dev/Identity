/* What the AOT emit restored to this harness, pinned so that the description of
 * it in CLAUDE.md's *Architecture* section has a suite behind it rather than a
 * recollection. Its subject is the HARNESS, not the primitives it borrows: each
 * test asserts the cheapest observable consequence of one authoring technique
 * working, and nothing here is a claim about whether the borrowed component is
 * correct. When one of these primitives changes shape, fix the fixture -- do not
 * grow an assertion about the component into this file, because a suite that
 * tests two things stops being evidence for either.
 *
 * Why it exists at all. Until batch 8C11 this directory ran under
 * `@angular/compiler`'s JIT, where three techniques did not work and one of the
 * three did not even fail loudly: `setInput()` on an undiscovered signal input
 * silently no-opped and the render kept the field's default, so a suite built on
 * it passed vacuously. The whole directory was written around that, through a
 * bypass convention that overwrote a child's instance field directly. The bypass
 * is retired and the techniques are the normal ones again -- and a capability
 * that is merely *believed* to work is exactly what the bypass convention was
 * built on top of, so each is asserted here instead.
 *
 * These are deliberately positive-only. A test proving a technique still fails
 * would be pinning a limitation, and this file exists because those expired. */
import { useTestEnvironment } from './testbed-env';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommandPalette } from '../components/navigation/command-palette/CommandPalette';
import { ConfirmDialog } from '../components/feedback/confirm-dialog/ConfirmDialog';
import { EmptyState } from '../components/feedback/empty-state/EmptyState';
import { ArenaAction } from '../components/projection-markers';
import { StatCard } from '../components/display/stat-card/StatCard';

/** Carries both content-projection claims at once: `[title]` is a property binding
 *  onto a required signal input, and the `[action]`-marked button is real projected
 *  content for `EmptyState`'s `contentChild(ArenaAction)` to find. */
@Component({
  standalone: true,
  imports: [EmptyState, ArenaAction],
  template: `<arena-empty-state [title]="heading"><button action>New project</button></arena-empty-state>`,
})
class EmptyStateWithActionHost {
  heading = 'No projects yet';
}

test('a template binding reaches a signal input', () => {
  const fixture = TestBed.createComponent(EmptyStateWithActionHost);
  try {
    fixture.detectChanges();
    const host = (fixture.nativeElement as Element).querySelector('arena-empty-state');
    assert.ok(host, 'sanity: the child component must render');
    assert.equal(
      host.textContent?.includes('No projects yet'),
      true,
      "the host's field must reach the child's required `title` input through `[title]`",
    );
  } finally {
    fixture.destroy();
  }
});

test('contentChild() resolves against real projected content', () => {
  const fixture = TestBed.createComponent(EmptyStateWithActionHost);
  try {
    fixture.detectChanges();
    const host = (fixture.nativeElement as Element).querySelector('arena-empty-state') as Element;
    /* `EmptyState`'s template wraps its projection slot in `@if (action())`, where
     * `action` IS the `contentChild(ArenaAction)` query -- so the wrapper rendering
     * at all is the query having resolved. The query is `protected`, and this is
     * the observable half of it rather than a workaround for that. */
    assert.ok(
      host.querySelector('button'),
      'the projected [action] button must render, which it only does once the contentChild query resolves',
    );
  } finally {
    fixture.destroy();
  }
});

test('setInput() drives required string inputs on a directly created fixture', () => {
  const fixture = TestBed.createComponent(StatCard);
  try {
    fixture.componentRef.setInput('label', 'Uptime');
    fixture.componentRef.setInput('value', '99.98%');
    fixture.detectChanges();
    const text = (fixture.nativeElement as Element).textContent ?? '';
    /* `StatCard.label` and `.value` are both `input.required<string>()`, which is
     * why this fixture and not a defaulted one: a required input has no default to
     * fall back to, so a silent no-op could not be mistaken for a pass. */
    assert.equal(text.includes('Uptime'), true, 'a required string input must reach the DOM through setInput()');
    assert.equal(text.includes('99.98%'), true, 'the second required string input must reach it too');
  } finally {
    fixture.destroy();
  }
});

test('setInput() drives a required boolean input carrying a booleanAttribute transform', () => {
  const fixture = TestBed.createComponent(CommandPalette);
  try {
    /* `CommandPalette.open` is `input.required<boolean, unknown>({ transform:
     * booleanAttribute })`, so this exercises the write path through a transform as
     * well as the write itself. The palette gates its whole panel on `open()`, so
     * the search input existing is the transform having produced `true`. */
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('commands', [{ id: 'a', label: 'Alpha' }]);
    fixture.detectChanges();
    assert.ok(
      (fixture.nativeElement as Element).querySelector('input'),
      'an open palette must render its search input',
    );
  } finally {
    fixture.destroy();
  }
});

test('setInput() drives an OPTIONAL boolean input carrying a booleanAttribute transform', () => {
  const fixture = TestBed.createComponent(ConfirmDialog);
  try {
    /* The optional counterpart of the test above -- `ConfirmDialog.open` is
     * `input(false, { transform: booleanAttribute })`, i.e. it has a default the
     * write has to actually displace, which is the shape a JIT no-op used to hide
     * behind. Note the role: this component renders `role="alertdialog"`, not
     * `role="dialog"`, and a probe run during this batch's close-out reported the
     * write as failing only because it queried for the latter. That is recorded
     * here because a wrong-selector result read as a capability failure is how a
     * retired limitation gets written back into the record. */
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Delete project');
    fixture.detectChanges();
    assert.ok(
      (fixture.nativeElement as Element).querySelector('[role="alertdialog"]'),
      'an open confirm dialog must render its panel',
    );
  } finally {
    fixture.destroy();
  }
});
