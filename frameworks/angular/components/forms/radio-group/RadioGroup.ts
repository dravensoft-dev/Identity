import {
  ChangeDetectionStrategy, Component, computed, inject, input, output, signal,
} from '@angular/core';
import { RadioGroupState } from './RadioGroupState';
import { radioGroupStyles } from './RadioGroup.variants';

let nextId = 0;

@Component({
  selector: 'arena-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RadioGroupState],
  host: {
    '[class]': 'styles().group()',
    role: 'radiogroup',
    '[attr.aria-label]': 'label()',
    '[attr.name]': 'null',
  },
  template: `<ng-content />`,
})
export class RadioGroup {
  readonly ariaLabel = input.required<string>();
  readonly value = input<string>();
  readonly name = input<string>();
  readonly change = output<string>();

  protected readonly label = computed(() => {
    const name = this.ariaLabel();
    if (name.trim() === '') {
      throw new Error('RadioGroup: `ariaLabel` is required, and names what is being chosen');
    }
    return name;
  });

  protected readonly styles = computed(() => radioGroupStyles());

  private readonly fallbackName = `arena-radio-group-${nextId++}`;
  private readonly chosen = signal<string | undefined>(undefined);
  private readonly state = inject(RadioGroupState);

  constructor() {
    this.state.groupName = computed(() => this.name() ?? this.fallbackName);
    this.state.selected = computed(() => this.value() ?? this.chosen());
    this.state.choose = (value: string) => {
      this.chosen.set(value);
      this.change.emit(value);
    };
  }
}
