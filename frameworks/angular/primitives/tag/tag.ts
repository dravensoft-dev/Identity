import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import type { TagTone } from '../../api.generated';
import { tagStyles } from './tag.variants';

/** Arena status/emphasis tag — pill, tone taxonomy per the Badge/Tag rule.
 *  The host itself is the recipe's `root` — it is the flex item a parent row lays
 *  out, so root-level classes must live on the host, not one element inside it.
 *  `removable` shows an Arena-drawn dismiss `×` that emits `remove` on click. */
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
