import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output,
} from '@angular/core';
import type { SelectOption } from '../../../Api.generated';
import { selectStyles } from './Select.variants';

let nextId = 0;

@Component({
  selector: 'arena-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.name]': 'null',
  },
  template: `
    @if (label(); as text) {
      <label [class]="styles().label()" [attr.for]="selectId">{{ text }}</label>
    }
    <div [class]="styles().wrap()">
      <select [class]="styles().field()" [attr.id]="selectId" [disabled]="disabled()"
              [required]="required()" [attr.name]="name()" [multiple]="multiple()"
              (change)="onChange($event)">
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
      <span [class]="styles().caret()" aria-hidden="true">&#9662;</span>
    </div>
  `,
})
export class Select {
  readonly label = input<string>();
  readonly options = input<readonly SelectOption[]>([]);
  readonly value = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly change = output<string>();

  protected readonly selectId = `arena-select-${nextId++}`;
  protected readonly styles = computed(() => selectStyles({ disabled: this.disabled() }));

  protected onChange(event: Event): void {
    event.stopPropagation();
    this.change.emit((event.target as HTMLSelectElement).value);
  }
}
