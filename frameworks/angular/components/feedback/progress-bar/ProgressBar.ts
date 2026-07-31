import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import type { ControlSize, ProgressTone } from '../../../Api.generated';
import { progressBarStyles } from './ProgressBar.variants';

export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

@Component({
  selector: 'arena-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
  },
  template: `
    @if (showsHead()) {
      <div [class]="styles().head()">
        @if (label(); as text) {
          <span [class]="styles().label()">{{ text }}</span>
        }
        @if (showsValue()) {
          <span [class]="styles().value()">{{ percentage() }}%</span>
        }
      </div>
    }
    <div [class]="trackClass()" role="progressbar" aria-live="polite"
         [attr.aria-valuenow]="indeterminate() ? null : percentage()"
         aria-valuemin="0" aria-valuemax="100"
         [attr.aria-label]="label() ?? 'Progress'">
      @if (!indeterminate()) {
        <span [class]="styles().fill()" [style.width.%]="percentage()"></span>
      }
    </div>
  `,
})
export class ProgressBar {
  readonly progressPercentage = input(0, { transform: numberAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly tone = input<ProgressTone>('accent');
  readonly label = input<string>();
  readonly showPercentage = input(true, { transform: booleanAttribute });
  readonly size = input<ControlSize>('md');

  protected readonly percentage = computed(() => clampPercentage(this.progressPercentage()));
  protected readonly showsValue = computed(() => this.showPercentage() && !this.indeterminate());
  protected readonly showsHead = computed(() => this.label() !== undefined || this.showsValue());

  protected readonly styles = computed(() => progressBarStyles({ tone: this.tone(), size: this.size() }));

  protected readonly trackClass = computed(() => {
    const styles = this.styles();
    return this.indeterminate() ? `${styles.track()} ${styles.indeterminate()}` : styles.track();
  });
}
