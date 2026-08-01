import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { TableColumn, TablePage, TableSort } from '../../../Api.generated';
import { Badge } from '../badge/Badge';
import { Button } from '../../forms/button/Button';
import { Table } from './Table';
import { TableRow } from '../table-row/TableRow';
import { TableCell } from '../table-cell/TableCell';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Button, Table, TableRow, TableCell],
  template: `
    <p class="sub">Wide — Tab once into the grid, then walk it with the arrows, Home and End</p>
    <div class="box">
      <arena-table [label]="'Recent deployments'" [columns]="columns"
                   [sort]="sort()" (sortChange)="sort.set($event)"
                   [page]="page()" (pageChange)="goTo($event)">
        <arena-table-row interactive (click)="opened.set('checkout-api')">
          <arena-table-cell>checkout-api</arena-table-cell>
          <arena-table-cell>4f2a1c9</arena-table-cell>
          <arena-table-cell><arena-badge tone="success" dot>Live</arena-badge></arena-table-cell>
          <arena-table-cell>
            <arena-button variant="ghost" size="sm" (click)="details.set('checkout-api')">Details</arena-button>
          </arena-table-cell>
        </arena-table-row>
        <arena-table-row interactive (click)="opened.set('billing-worker')">
          <arena-table-cell>billing-worker</arena-table-cell>
          <arena-table-cell>9db3e07</arena-table-cell>
          <arena-table-cell><arena-badge tone="warning">Rolling out</arena-badge></arena-table-cell>
          <arena-table-cell>
            <arena-button variant="ghost" size="sm" (click)="details.set('billing-worker')">Details</arena-button>
          </arena-table-cell>
        </arena-table-row>
        <arena-table-row interactive disabled (click)="opened.set('auth-service')">
          <arena-table-cell>auth-service</arena-table-cell>
          <arena-table-cell>c1e8a44</arena-table-cell>
          <arena-table-cell><arena-badge tone="danger">Failed</arena-badge></arena-table-cell>
          <arena-table-cell>
            <arena-button variant="ghost" size="sm" (click)="details.set('auth-service')">Details</arena-button>
          </arena-table-cell>
        </arena-table-row>
      </arena-table>
    </div>
    <p class="log">last activated: {{ opened() || '—' }} · the third row is disabled and must never appear here</p>
    <p class="log">last details: {{ details() || '—' }} · a control in a cell keeps its own tab stop, and reaching it must cost ONE Tab</p>

    <p class="sub">The same table in a container below --bp-md — one card per row, measured on the container</p>
    <div class="squeezed">
      <arena-table [label]="'Recent deployments, squeezed'" [columns]="columns">
        <arena-table-row>
          <arena-table-cell>checkout-api</arena-table-cell>
          <arena-table-cell>4f2a1c9</arena-table-cell>
          <arena-table-cell><arena-badge tone="success" dot>Live</arena-badge></arena-table-cell>
          <arena-table-cell>
            <arena-button variant="ghost" size="sm">Details</arena-button>
          </arena-table-cell>
        </arena-table-row>
        <arena-table-row>
          <arena-table-cell>billing-worker</arena-table-cell>
          <arena-table-cell>9db3e07</arena-table-cell>
          <arena-table-cell><arena-badge tone="warning">Rolling out</arena-badge></arena-table-cell>
          <arena-table-cell>
            <arena-button variant="ghost" size="sm">Details</arena-button>
          </arena-table-cell>
        </arena-table-row>
      </arena-table>
    </div>

    <p class="sub">responsive="false" in the same squeezed container — the grid stays a grid and scrolls instead</p>
    <div class="squeezed">
      <arena-table [label]="'Pinned wide'" [columns]="columns" [responsive]="false">
        <arena-table-row>
          <arena-table-cell>checkout-api</arena-table-cell>
          <arena-table-cell>4f2a1c9</arena-table-cell>
          <arena-table-cell><arena-badge tone="success" dot>Live</arena-badge></arena-table-cell>
          <arena-table-cell>
            <arena-button variant="ghost" size="sm">Details</arena-button>
          </arena-table-cell>
        </arena-table-row>
      </arena-table>
    </div>

    <p class="sub">Empty — the header still names its columns and the [empty] slot fills the frame</p>
    <div class="box">
      <arena-table [label]="'Deployments in this range'" [columns]="columns">
        <span empty>No deployments in this range.</span>
      </arena-table>
    </div>
  `,
})
class TableCard {
  protected readonly columns: TableColumn[] = [
    { header: 'Service', sortable: true },
    { header: 'Commit', mono: true },
    { header: 'Status', align: 'right', sortable: true },
    { header: '', mobileLayout: 'block' },
  ];

  protected readonly sort = signal<TableSort>({ column: 0, direction: 'asc' });

  protected readonly page = signal<TablePage>({ index: 1, size: 3, total: 12 });

  protected goTo(index: number): void {
    this.page.update((current) => ({ ...current, index }));
  }

  protected readonly opened = signal('');

  protected readonly details = signal('');
}

bootstrapApplication(TableCard, { providers: [provideZonelessChangeDetection()] });
