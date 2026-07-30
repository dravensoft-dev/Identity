import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output, signal,
} from '@angular/core';
import type { InputType, ValidateOn } from '../../../Api.generated';
import { inputStyles } from './Input.variants';

export function controlIdFor(id: string | undefined, label: string | undefined): string | null {
  if (id) return id;
  return label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : null;
}

@Component({
  selector: 'arena-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    @if (label(); as text) {
      <label [class]="styles().label()" [attr.for]="controlId()">{{ text }}@if (required()) {
        <span [class]="styles().required()">*</span>
      }</label>
    }
    <div [class]="styles().field()">
      @if (icon()) {
        <i [class]="iconClass()" aria-hidden="true"></i>
      }
      @if (prefix(); as text) {
        <span [class]="styles().prefix()">{{ text }}</span>
      }
      <input [class]="styles().input()" [attr.id]="controlId()" [attr.type]="type()"
             [value]="value() ?? ''" [disabled]="disabled()" [readOnly]="readOnly()"
             [required]="required()" [attr.aria-invalid]="hasError()"
             [attr.placeholder]="placeholder()" [attr.name]="name()"
             [attr.autocomplete]="autoComplete()" [attr.min]="min()" [attr.max]="max()"
             [attr.step]="step()" [attr.maxlength]="maxLength()" [attr.pattern]="pattern()"
             (input)="onInput($event)" (change)="onNativeChange($event)" (blur)="onBlur($event)" />
      @if (hasError()) {
        <i [class]="statusIconClass('ph-fill ph-warning-circle')" aria-hidden="true"></i>
      } @else if (isValid()) {
        <i [class]="statusIconClass('ph-fill ph-check-circle')" aria-hidden="true"></i>
      }
    </div>
    @if (shownError(); as message) {
      <span [class]="styles().error()">{{ message }}</span>
    } @else if (hint(); as text) {
      <span [class]="styles().hint()">{{ text }}</span>
    }
  `,
})
export class Input {
  readonly label = input<string>();
  readonly id = input<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly valid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly validate = input<(value: string) => string>();
  readonly validateOn = input<ValidateOn>('blur');
  readonly type = input<InputType>('text');
  readonly icon = input<string>();
  readonly prefix = input<string>();
  readonly value = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>();
  readonly name = input<string>();
  readonly autoComplete = input<string>();
  readonly min = input<string>();
  readonly max = input<string>();
  readonly step = input<string>();
  readonly maxLength = input<number>();
  readonly pattern = input<string>();
  readonly change = output<string>();
  readonly blur = output<string>();

  private readonly localError = signal<string | null>(null);
  private readonly touched = signal(false);

  protected readonly controlId = computed(() => controlIdFor(this.id(), this.label()));

  protected readonly shownError = computed(() => {
    const controlled = this.error();
    if (controlled !== undefined) return controlled;
    return this.touched() ? this.localError() : null;
  });

  protected readonly hasError = computed(() => Boolean(this.shownError()));

  protected readonly isValid = computed(() => !this.hasError()
    && (this.valid() || (this.touched() && this.validate() !== undefined && this.localError() === null)));

  protected readonly styles = computed(() => inputStyles({
    state: this.hasError() ? 'error' : this.isValid() ? 'valid' : 'neutral',
    disabled: this.disabled(),
    readonly: this.readOnly(),
  }));

  protected readonly iconClass = computed(() => `${this.styles().icon()} ${this.icon() ?? ''}`.trim());

  protected statusIconClass(glyph: string): string {
    return `${glyph} ${this.styles().statusIcon()}`;
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.change.emit(text);
    if (this.validateOn() === 'change') {
      this.touched.set(true);
      this.runValidate(text);
    }
  }

  protected onNativeChange(event: Event): void {
    event.stopPropagation();
  }

  protected onBlur(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.touched.set(true);
    this.runValidate(text);
    this.blur.emit(text);
  }

  private runValidate(text: string): void {
    const fn = this.validate();
    if (fn) this.localError.set(fn(text) || null);
  }
}
