import {
  ChangeDetectionStrategy, Component, DestroyRef, booleanAttribute, computed, contentChildren,
  inject, input, output,
} from '@angular/core';
import { TableCell } from '../table-cell/TableCell';
import { TableState } from '../table/TableState';
import { TableRowState } from './TableRowState';
import { tableRowStyles } from './TableRow.variants';

@Component({
  selector: 'arena-table-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TableRowState],
  host: { style: 'display: contents' },
  template: `
    <div [class]="rowClass()" [attr.role]="role()" [attr.aria-disabled]="inert()"
         (click)="onClick($event)">
      <ng-content />
    </div>
  `,
})
export class TableRow {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly click = output<void>();

  private readonly table = inject(TableState);
  private readonly rowState = inject(TableRowState);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cells = contentChildren(TableCell);

  protected readonly role = computed(() => (this.table.narrow() ? null : 'row'));

  protected readonly inert = computed(() => (this.disabled() ? 'true' : null));

  protected readonly rowClass = computed(() => {
    const narrow = this.table.narrow();
    const styles = tableRowStyles({ narrow });
    if (narrow) return styles.card();
    return this.table.rowIndexOf(this) === 1 ? `${styles.row()} ${styles.rowFirst()}` : styles.row();
  });

  constructor() {
    this.rowState.index = computed(() => this.table.rowIndexOf(this));
    this.rowState.cells = this.cells;
    this.table.registerRow(this, {
      cells: computed(() => this.cells().length),
      activate: () => this.emit(),
    });
    this.destroyRef.onDestroy(() => this.table.releaseRow(this));
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.emit();
  }

  private emit(): void {
    if (!this.disabled()) this.click.emit();
  }
}
