import {
  ChangeDetectionStrategy, Component, computed, input, output, signal,
} from '@angular/core';
import type { SegmentOption, SegmentedControlSize } from '../../../Api.generated';
import { segmentedControlStyles } from './SegmentedControl.variants';

let nextId = 0;

@Component({
  selector: 'arena-segmented-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().track()',
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.name]': 'null',
  },
  template: `
    @for (option of options(); track option.value) {
      <label [class]="segmentClass(option.value)">
        {{ option.label }}
        <input type="radio" [class]="styles().input()" [attr.name]="groupName()"
               [attr.value]="option.value" [checked]="option.value === selected()"
               (change)="choose(option.value, $event)" />
      </label>
    }
  `,
})
export class SegmentedControl {
  readonly options = input.required<readonly SegmentOption[]>();
  readonly value = input<string>();
  readonly defaultValue = input<string>();
  readonly size = input<SegmentedControlSize>('md');
  readonly ariaLabel = input.required<string>();
  readonly name = input<string>();
  readonly change = output<string>();

  private readonly fallbackName = `arena-segmented-control-${nextId++}`;
  private readonly chosen = signal<string | undefined>(undefined);

  protected readonly groupName = computed(() => this.name() ?? this.fallbackName);

  protected readonly selected = computed(() => this.value()
    ?? this.chosen()
    ?? this.defaultValue()
    ?? this.options()[0]?.value);

  protected readonly styles = computed(() => segmentedControlStyles({ size: this.size() }));

  protected segmentClass(value: string): string {
    return segmentedControlStyles({ size: this.size(), selected: value === this.selected() }).segment();
  }

  protected choose(value: string, event: Event): void {
    event.stopPropagation();
    this.chosen.set(value);
    this.change.emit(value);
  }
}
