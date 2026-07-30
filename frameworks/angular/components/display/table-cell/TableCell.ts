import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { TableColumn } from '../../../Api.generated';
import { TableState } from '../table/TableState';
import { TableRowState } from '../table-row/TableRowState';
import { tableCellStyles } from './TableCell.variants';

const PLAIN: TableColumn = { header: '' };

@Component({
  selector: 'arena-table-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'cellClass()',
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'tabIndex()',
    '[style.width]': 'width()',
    '(focus)': 'onFocus()',
  },
  template: `
    @if (labelled()) {
      <span [class]="styles().cardLabel()">{{ column().header }}</span>
    }
    <span [class]="valueClass()"><ng-content /></span>
  `,
})
export class TableCell {
  private readonly table = inject(TableState);
  private readonly row = inject(TableRowState);

  protected readonly columnIndex = computed(() => this.row.columnIndexOf(this));

  protected readonly column = computed(() => this.table.columns()[this.columnIndex()] ?? PLAIN);

  protected readonly narrow = computed(() => this.table.narrow());

  protected readonly styles = computed(() => tableCellStyles({ narrow: this.narrow() }));

  protected readonly labelled = computed(() => this.narrow() && this.column().mobileLayout !== 'block');

  protected readonly role = computed(() => (this.narrow() ? null : 'gridcell'));

  protected readonly width = computed(() => (this.narrow() ? null : this.column().width ?? null));

  protected readonly tabIndex = computed(() => {
    if (this.narrow()) return null;
    return this.table.isStop(this.row.index(), this.columnIndex()) ? 0 : -1;
  });

  protected readonly cellClass = computed(() => {
    const column = this.column();
    if (this.narrow()) {
      const styles = tableCellStyles({ narrow: true });
      return column.mobileLayout === 'block' ? styles.cardBlock() : styles.cardRow();
    }
    const styles = tableCellStyles({ narrow: false, align: column.align ?? 'left' });
    return column.mono ? styles.tdMono() : styles.td();
  });

  protected readonly valueClass = computed(() => {
    if (!this.narrow() || this.column().mobileLayout === 'block') return '';
    const styles = tableCellStyles({ narrow: true });
    return this.column().mono ? styles.cardValueMono() : styles.cardValue();
  });

  protected onFocus(): void {
    if (this.narrow()) return;
    this.table.cursor.set({ row: this.row.index(), col: this.columnIndex() });
  }
}
