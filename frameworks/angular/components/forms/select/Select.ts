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
      @if (icon(); as glyph) {
        <i [class]="styles().iconWrap() + ' ' + glyph" aria-hidden="true"></i>
      }
      <select [class]="styles().field()" [attr.id]="selectId" [disabled]="disabled()"
              [required]="required()" [attr.name]="name()"
              [attr.aria-invalid]="hasError()" [attr.aria-describedby]="describedBy()"
              (change)="onChange($event)">
        @if (placeholder(); as text) {
          <option value="" [disabled]="true" [selected]="!value()">{{ text }}</option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
      <span [class]="styles().caret()" aria-hidden="true">&#9662;</span>
    </div>
    @if (error(); as message) {
      <span [class]="styles().error()" [attr.id]="noteId">{{ message }}</span>
    } @else if (hint(); as text) {
      <span [class]="styles().hint()" [attr.id]="noteId">{{ text }}</span>
    }
  `,
})
export class Select {
  readonly label = input<string>();
  readonly placeholder = input<string>();
  readonly options = input<readonly SelectOption[]>([]);
  readonly value = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly valid = input(false, { transform: booleanAttribute });
  readonly icon = input<string>();
  readonly name = input<string>();
  readonly change = output<string>();

  protected readonly selectId = `arena-select-${nextId++}`;
  protected readonly noteId = `${this.selectId}-note`;

  protected readonly hasError = computed(() => Boolean(this.error()));

  protected readonly describedBy = computed(() => (this.error() || this.hint() ? this.noteId : null));

  protected readonly styles = computed(() => selectStyles({
    disabled: this.disabled(),
    hasIcon: Boolean(this.icon()),
    state: this.hasError() ? 'error' : this.valid() ? 'valid' : 'neutral',
  }));

  protected onChange(event: Event): void {
    event.stopPropagation();
    this.change.emit((event.target as HTMLSelectElement).value);
  }
}
