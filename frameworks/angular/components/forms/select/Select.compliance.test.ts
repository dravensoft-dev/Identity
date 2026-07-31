/* Both requirements of `select` are decidable from the element, so this file has no
 * `behavioural` map at all: the browser owns the popup, the keys and the focus, which
 * is the whole reason Select binds `select` rather than `combobox`. What is NOT free is
 * containment — `change` is an Arena output whose name a native <select> event already
 * carries, so the second test measures that the native one never leaves the host
 * instead of arguing that it cannot. */
import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { assertPattern, ANGULAR_COMPONENTS } from '../../../test/Compliance';
import type { SelectOption } from '../../../Api.generated';
import { Select } from './Select';

const BINDING = join(ANGULAR_COMPONENTS, 'forms/select/Select.behaviour.json');

const OPTIONS: SelectOption[] = [
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

@Component({
  standalone: true,
  imports: [Select],
  template: `
    <div id="outside">
      <arena-select label="Environment" [options]="options" value="staging" name="env"
                    (change)="chosen.push($event)" />
    </div>
  `,
})
class SelectHost {
  readonly options = OPTIONS;
  readonly chosen: string[] = [];
}

test('arena-select meets the select pattern it binds', () => {
  const fixture = TestBed.createComponent(SelectHost);
  try {
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('arena-select') as HTMLElement;
    const field = host.querySelector('select') as HTMLSelectElement;
    assert.ok(field, 'arena-select must render the native element the pattern is about');

    const labels = Array.from(host.querySelectorAll('label'));
    assert.equal(labels.length, 1, 'the fixture must supply exactly one label');
    assert.equal(labels[0].getAttribute('for'), field.getAttribute('id'),
      'roles.label: the label must point at the control it names');

    assertPattern({ root: host, bindingPath: BINDING, subjects: { default: field } });
  } finally {
    fixture.destroy();
  }
});

test('the native change event never leaves the host, so a consumer sees the Arena output once and the DOM event never', () => {
  const fixture = TestBed.createComponent(SelectHost);
  const seen: Event[] = [];
  try {
    fixture.detectChanges();
    const outside = fixture.nativeElement.querySelector('#outside') as HTMLElement;
    const host = fixture.nativeElement.querySelector('arena-select') as HTMLElement;
    const field = host.querySelector('select') as HTMLSelectElement;
    outside.addEventListener('change', (event) => seen.push(event));

    field.value = 'production';
    field.dispatchEvent(new Event('change', { bubbles: true }));

    assert.deepEqual(fixture.componentInstance.chosen, ['production'],
      'the Arena output must carry the chosen value exactly once');
    assert.equal(seen.length, 0,
      'the native change must be stopped inside the host: it shares a name with the contracted output, ' +
      'so a consumer listening on an ancestor would otherwise be told twice');
  } finally {
    fixture.destroy();
  }
});

test('value selects the matching option rather than being written onto the element before its options exist', () => {
  const fixture = TestBed.createComponent(SelectHost);
  try {
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const options = Array.from(field.querySelectorAll('option'));
    assert.deepEqual(options.map((o) => o.getAttribute('value')), ['staging', 'production']);
    assert.equal(field.value, 'staging', 'the option matching value must be the selected one');
    assert.equal(field.getAttribute('name'), 'env', 'name must reach the control that submits');
  } finally {
    fixture.destroy();
  }
});

test('the name input does not leave a stray global attribute on the host element', () => {
  const fixture = TestBed.createComponent(SelectHost);
  try {
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('arena-select') as HTMLElement;
    assert.equal(host.getAttribute('name'), null,
      'name belongs to the inner control, not to <arena-select>');
  } finally {
    fixture.destroy();
  }
});
