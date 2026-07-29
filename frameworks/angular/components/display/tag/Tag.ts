import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import type { TagTone } from '../../../Api.generated';
import { tagStyles } from './Tag.variants';

@Component({
  selector: 'arena-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <span [class]="styles().dot()"></span>
    <ng-content />
    @if (removable()) {
      <button type="button" [class]="styles().close()" aria-label="Remove" (click)="remove.emit()">
        <i class="ph-bold ph-x" aria-hidden="true"></i>
      </button>
    }
  `,
})
export class Tag {
  readonly tone = input<TagTone>('neutral');
  readonly removable = input(false, { transform: booleanAttribute });
  readonly remove = output<void>();
  protected readonly styles = computed(() => tagStyles({ tone: this.tone() }));
}
