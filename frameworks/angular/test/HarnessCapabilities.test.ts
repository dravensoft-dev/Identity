import { useTestEnvironment } from './TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommandPalette } from '../components/navigation/command-palette/CommandPalette';
import { ConfirmDialog } from '../components/feedback/confirm-dialog/ConfirmDialog';
import { EmptyState } from '../components/feedback/empty-state/EmptyState';
import { ArenaAction } from '../ProjectionMarkers';
import { StatCard } from '../components/display/stat-card/StatCard';

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

    assert.equal(text.includes('Uptime'), true, 'a required string input must reach the DOM through setInput()');
    assert.equal(text.includes('99.98%'), true, 'the second required string input must reach it too');
  } finally {
    fixture.destroy();
  }
});

test('setInput() drives a required boolean input carrying a booleanAttribute transform', () => {
  const fixture = TestBed.createComponent(CommandPalette);
  try {

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
