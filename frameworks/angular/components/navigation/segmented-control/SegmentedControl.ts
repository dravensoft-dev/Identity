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
  /** The options, in order. Two to four with one-word labels. */
  readonly options = input.required<readonly SegmentOption[]>();
  /** The selected option's value. Omit and pass `defaultValue` to let it govern itself. */
  readonly value = input<string>();
  /** The initially selected value when uncontrolled. Defaults to the first option. */
  readonly defaultValue = input<string>();
  /** Compact or default. */
  readonly size = input<SegmentedControlSize>('md');
  /** Names what is being filtered — "Time range", not "Filter". A radio group with no accessible name is announced unlabelled. */
  readonly ariaLabel = input.required<string>();
  /** Shared name for the underlying radios; generated when omitted. */
  readonly name = input<string>();
  /** A different option was chosen; carries its value. */
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
