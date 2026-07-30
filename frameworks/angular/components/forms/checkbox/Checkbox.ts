import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output,
} from '@angular/core';
import { checkboxStyles } from './Checkbox.variants';

export const CHECK_GLYPH_STYLE = { width: 'var(--sp-3)', height: 'var(--sp-3)' };
export const CHECK_STROKE_STYLE = { strokeWidth: 'var(--bw-strong)' };

@Component({
  selector: 'arena-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[attr.name]': 'null',
  },
  template: `
    <label [class]="styles().root()">
      <span [class]="styles().box()">
        @if (checked()) {
          <svg [class]="styles().check()" viewBox="0 0 12 12" fill="none" [style]="glyph">
            <path d="M2 6l3 3 5-6" stroke="currentColor" stroke-linecap="round"
                  stroke-linejoin="round" [style]="glyphStroke"></path>
          </svg>
        }
      </span>
      @if (label(); as text) {
        <span [class]="styles().label()">{{ text }}</span>
      }
      <input type="checkbox" [class]="styles().input()" [checked]="checked()"
             [attr.name]="name()" [attr.value]="value()" [required]="required()"
             [disabled]="disabled()" (change)="onChange($event)" />
    </label>
  `,
})
export class Checkbox {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly value = input<string>();
  readonly change = output<boolean>();

  protected readonly glyph = CHECK_GLYPH_STYLE;
  protected readonly glyphStroke = CHECK_STROKE_STYLE;

  protected readonly styles = computed(() => checkboxStyles({
    checked: this.checked(), disabled: this.disabled(),
  }));

  protected onChange(event: Event): void {
    event.stopPropagation();
    this.change.emit((event.target as HTMLInputElement).checked);
  }
}
