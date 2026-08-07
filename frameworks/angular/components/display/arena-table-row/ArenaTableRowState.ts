import { Injectable, type Signal, signal } from '@angular/core';

@Injectable()
export class ArenaTableRowState {
  index: Signal<number> = signal(0);
  cells: Signal<readonly object[]> = signal([]);

  columnIndexOf(cell: object): number {
    return this.cells().indexOf(cell);
  }
}
