import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input,
} from '@angular/core';
import { RadioGroupState } from '../radio-group/RadioGroupState';
import { radioStyles } from './Radio.variants';

@Component({
  selector: 'arena-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <label [class]="styles().root()">
      <span [class]="styles().ring()">
        @if (checked()) {
          <span [class]="styles().dot()"></span>
        }
      </span>
      @if (label() || hint()) {
        <span [class]="styles().text()">
          @if (label(); as text) {
            <span [class]="styles().label()">{{ text }}</span>
          }
          @if (hint(); as text) {
            <span [class]="styles().hint()">{{ text }}</span>
          }
        </span>
      }
      <input type="radio" [class]="styles().input()" [attr.name]="groupName()"
             [attr.value]="value()" [checked]="checked()" [disabled]="disabled()"
             (change)="onChange($event)" />
    </label>
  `,
})
export class Radio {
  /** This option's value, matched against the group's. */
  readonly value = input.required<string>();
  /** The option's label. */
  readonly label = input<string>();
  /** A line of help under the label. */
  readonly hint = input<string>();
  /** Blocks selection and dims the option. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly group = inject(RadioGroupState);

  protected readonly groupName = computed(() => this.group.groupName());
  protected readonly checked = computed(() => this.group.selected() === this.value());

  protected readonly styles = computed(() => radioStyles({
    checked: this.checked(), disabled: this.disabled(),
  }));

  protected onChange(event: Event): void {
    event.stopPropagation();
    if (!this.disabled()) this.group.choose(this.value());
  }
}
