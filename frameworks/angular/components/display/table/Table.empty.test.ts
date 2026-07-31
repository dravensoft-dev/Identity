import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();
import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { TableColumn } from '../../../Api.generated';
import { Table } from './Table';

@Component({
  standalone: true, imports: [Table],
  template: `<arena-table label="Recent deployments" [columns]="columns" />`,
})
class EmptyHost { columns: TableColumn[] = [{ header: 'Service' }]; }

test('a table with no rows and no projected empty content says what Table.json contracts it says', () => {
  const fixture = TestBed.createComponent(EmptyHost);
  fixture.detectChanges();
  try {
    const text = (fixture.nativeElement as Element).textContent ?? '';
    assert.match(text, /No data\./,
      'an empty table that says nothing is a blank box the consumer has to explain; the fallback is the '
      + 'generic answer and a consumer who has a better one projects it');
  } finally { fixture.destroy(); }
});
