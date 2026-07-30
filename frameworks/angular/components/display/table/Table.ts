import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, computed,
  contentChildren, inject, input,
} from '@angular/core';
import type { TableColumn } from '../../../Api.generated';
import { containerWidth, readBreakpoint } from '../../../ContainerSize';
import { TableRow } from '../table-row/TableRow';
import { TableState } from './TableState';
import { tableStyles } from './Table.variants';

@Component({
  selector: 'arena-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TableState],
  host: { '[class]': 'styles().root()' },
  template: `
    <div [class]="styles().grid()" [attr.role]="narrow() ? null : 'grid'"
         [attr.aria-label]="gridLabel()" (keydown)="onKeydown($event)">
      @if (!narrow()) {
        <div role="row" [class]="styles().headRow()">
          @for (column of columns(); track $index; let i = $index) {
            <div role="columnheader" [class]="headerClass(column)" [style.width]="column.width"
                 [attr.tabindex]="state.isStop(0, i) ? 0 : -1"
                 (focus)="moveTo(0, i)">{{ column.header }}</div>
          }
        </div>
      }
      <ng-content />
    </div>
    @if (rows().length === 0) {
      <div [class]="styles().empty()"><ng-content select="[empty]" /></div>
    }
  `,
})
export class Table {
  readonly label = input.required<string>();
  readonly columns = input.required<TableColumn[]>();
  readonly responsive = input(true, { transform: booleanAttribute });

  protected readonly state = inject(TableState);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly measured = containerWidth();
  private readonly medium = readBreakpoint('md');

  protected readonly rows = contentChildren(TableRow);

  protected readonly narrow = computed(() => {
    const width = this.measured();
    return this.responsive() && width !== null && width < this.medium;
  });

  protected readonly gridLabel = computed(() => {
    const name = this.label();
    if (name.trim() === '') {
      throw new Error('Table: `label` is required, and names what the rows are — never "Table"');
    }
    return name;
  });

  protected readonly styles = computed(() => tableStyles({ narrow: this.narrow() }));

  constructor() {
    this.state.columns = this.columns;
    this.state.narrow = this.narrow;
    this.state.rows = this.rows;

    afterRenderEffect(() => {
      this.state.clamped();
      const grid = this.host.nativeElement.querySelector('[role="grid"]');
      if (!grid) return;
      const active = grid.ownerDocument.activeElement;
      if (!active || !grid.contains(active)) return;
      const role = active.getAttribute('role');
      if (role !== 'gridcell' && role !== 'columnheader') return;
      const stop = grid.querySelector<HTMLElement>(
        '[role="gridcell"][tabindex="0"], [role="columnheader"][tabindex="0"]',
      );
      if (stop && stop !== active) stop.focus();
    });
  }

  protected headerClass(column: TableColumn): string {
    return tableStyles({ narrow: false, align: column.align ?? 'left' }).th();
  }

  protected moveTo(row: number, col: number): void {
    if (!this.state.isStop(row, col)) this.state.cursor.set({ row, col });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as Element | null;
    const role = target?.getAttribute?.('role');
    if (role !== 'gridcell' && role !== 'columnheader') return;

    const lengths = this.state.lengths();
    const at = this.state.clamped();
    let { row, col } = at;

    if (event.key === 'ArrowUp') row = Math.max(0, row - 1);
    else if (event.key === 'ArrowDown') row = Math.min(lengths.length - 1, row + 1);
    else if (event.key === 'ArrowLeft') col = Math.max(0, col - 1);
    else if (event.key === 'ArrowRight') col = Math.min(Math.max((lengths[row] ?? 1) - 1, 0), col + 1);
    else if (event.key === 'Home') col = 0;
    else if (event.key === 'End') col = Math.max((lengths[row] ?? 1) - 1, 0);
    else if (event.key === 'Enter') {
      event.preventDefault();
      if (at.row > 0) this.state.activate(at.row);
      return;
    } else return;

    col = Math.min(col, Math.max((lengths[row] ?? 1) - 1, 0));
    event.preventDefault();
    this.moveTo(row, col);
  }
}
