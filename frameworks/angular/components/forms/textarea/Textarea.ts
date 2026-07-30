import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, booleanAttribute, computed,
  input, output, viewChild,
} from '@angular/core';
import { textareaStyles } from './Textarea.variants';

export const COUNTER_WARNING_SHARE = 0.9;

export function textareaIdFor(id: string | undefined, label: string | undefined): string | null {
  if (id) return id;
  return label ? `ta-${label.replace(/\s+/g, '-').toLowerCase()}` : null;
}

export function counterIsNear(length: number, maxLength: number): boolean {
  return length > maxLength * COUNTER_WARNING_SHARE;
}

export function borderBoxSlack(element: HTMLElement): number {
  return element.offsetHeight - element.clientHeight;
}

@Component({
  selector: 'arena-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.name]': 'null',
  },
  template: `
    @if (label(); as text) {
      <label [class]="styles().label()" [attr.for]="controlId()">{{ text }}@if (required()) {
        <span [class]="styles().required()">*</span>
      }</label>
    }
    <textarea #control [class]="styles().field()" [attr.id]="controlId()" [attr.rows]="rows()"
              [attr.maxlength]="maxLength()" [disabled]="disabled()" [required]="required()"
              [readOnly]="readOnly()" [attr.placeholder]="placeholder()" [attr.name]="name()"
              [attr.aria-invalid]="hasError()" [value]="value() ?? ''"
              (input)="onInput($event)" (change)="onNativeChange($event)"></textarea>
    <div [class]="styles().foot()">
      @if (shownError(); as message) {
        <span [class]="styles().error()">{{ message }}</span>
      } @else if (hint(); as text) {
        <span [class]="styles().hint()">{{ text }}</span>
      } @else {
        <span></span>
      }
      @if (counterText(); as text) {
        <span [class]="counterClass()">{{ text }}</span>
      }
    </div>
  `,
})
export class Textarea {
  readonly label = input<string>();
  readonly id = input<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly counter = input(false, { transform: booleanAttribute });
  readonly autoResize = input(false, { transform: booleanAttribute });
  readonly value = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>();
  readonly name = input<string>();
  readonly maxLength = input<number>();
  readonly rows = input(4);
  readonly change = output<string>();

  protected readonly controlId = computed(() => textareaIdFor(this.id(), this.label()));
  protected readonly shownError = computed(() => this.error() ?? null);
  protected readonly hasError = computed(() => Boolean(this.shownError()));

  protected readonly styles = computed(() => textareaStyles({
    state: this.hasError() ? 'error' : 'neutral',
    resize: this.autoResize() ? 'none' : 'vertical',
    disabled: this.disabled(),
    readonly: this.readOnly(),
  }));

  protected readonly length = computed(() => (this.value() ?? '').length);

  protected readonly counterText = computed(() => {
    const cap = this.maxLength();
    if (!this.counter() || cap === undefined) return null;
    return `${this.length()}/${cap}`;
  });

  protected readonly counterClass = computed(() => {
    const cap = this.maxLength();
    return cap !== undefined && counterIsNear(this.length(), cap)
      ? this.styles().counterNear()
      : this.styles().counter();
  });

  private readonly control = viewChild<ElementRef<HTMLTextAreaElement>>('control');

  constructor() {
    afterRenderEffect(() => {
      this.value();
      if (this.autoResize()) this.grow();
    });
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (this.autoResize()) this.fit(target);
    this.change.emit(target.value);
  }

  protected onNativeChange(event: Event): void {
    event.stopPropagation();
  }

  private grow(): void {
    const element = this.control()?.nativeElement;
    if (element) this.fit(element);
  }

  private fit(element: HTMLTextAreaElement): void {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight + borderBoxSlack(element)}px`;
  }
}
