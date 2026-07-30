import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { pageWindow } from './PaginationWindow';
import { paginationStyles } from './Pagination.variants';

@Component({
  selector: 'arena-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <nav [class]="styles().root()" [attr.aria-label]="label()">
      <button type="button" [class]="styles().nav()" [disabled]="page() <= 1"
              aria-label="Previous" (click)="go(page() - 1)">
        <i class="ph-bold ph-caret-left" aria-hidden="true"></i>
      </button>
      @for (slot of slots(); track $index) {
        @if (slot === '…') {
          <span [class]="styles().ellipsis()">{{ slot }}</span>
        } @else {
          <button type="button" [class]="pageClass(slot)"
                  [attr.aria-current]="slot === page() ? 'page' : null"
                  (click)="go(slot)">{{ slot }}</button>
        }
      }
      <button type="button" [class]="styles().nav()" [disabled]="page() >= pageCount()"
              aria-label="Next" (click)="go(page() + 1)">
        <i class="ph-bold ph-caret-right" aria-hidden="true"></i>
      </button>
    </nav>
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly ariaLabel = input.required<string>();
  readonly change = output<number>();

  protected readonly label = computed(() => {
    const name = this.ariaLabel();
    if (name.trim() === '') {
      throw new Error('Pagination: `ariaLabel` is required, and names what is being paged');
    }
    return name;
  });

  protected readonly slots = computed(() => {
    const total = this.pageCount();
    if (!Number.isInteger(total) || total < 1) {
      throw new Error('Pagination: `pageCount` is required, and is a whole number of at least 1');
    }
    return pageWindow(this.page(), total);
  });

  protected readonly styles = computed(() => paginationStyles());

  protected pageClass(page: number): string {
    const styles = paginationStyles();
    return `${styles.page()} ${page === this.page() ? styles.pageCurrent() : styles.pageOther()}`;
  }

  protected go(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.page()) return;
    this.change.emit(page);
  }
}
