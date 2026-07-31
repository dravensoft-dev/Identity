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
         [attr.tabindex]="cardStop()" (keydown)="onKeydown($event)"
         (click)="onClick($event)">
      <ng-content />
    </div>
  `,
})
export class TableRow {
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly click = output<void>();

  private readonly table = inject(TableState);
  private readonly rowState = inject(TableRowState);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cells = contentChildren(TableCell);

  protected readonly role = computed(() => {
    if (!this.table.narrow()) return 'row';
    return this.interactive() ? 'button' : null;
  });

  protected readonly cardStop = computed(() => (this.table.narrow() && this.interactive() ? 0 : null));

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

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.table.narrow() || !this.interactive()) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    this.emit();
  }

  private emit(): void {
    if (!this.disabled()) this.click.emit();
  }
}
