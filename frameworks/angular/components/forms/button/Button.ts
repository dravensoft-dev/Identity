import {
  ChangeDetectionStrategy, Component, ElementRef, afterNextRender, booleanAttribute, computed,
  input, output, viewChild,
} from '@angular/core';
import type { ButtonType, ButtonVariant, ControlSize } from '../../../Api.generated';
import { buttonStyles } from './Button.variants';

@Component({
  selector: 'arena-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button #control [class]="styles().root()" [attr.type]="type()" [disabled]="inert()"
            [attr.name]="name()" [attr.value]="value()" [attr.form]="form()"
            [attr.tabindex]="tabStop() ? null : -1" (click)="onClick($event)">
      @if (loading()) {
        <span [class]="styles().spinner()" aria-hidden="true"></span>
      } @else if (icon(); as glyph) {
        <i [class]="glyph" aria-hidden="true"></i>
      }
      <ng-content />
      @if (iconRight(); as glyph) {
        <i [class]="glyph" aria-hidden="true"></i>
      }
    </button>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ControlSize>('md');
  readonly icon = input<string>();
  readonly iconRight = input<string>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly full = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<ButtonType>('button');
  readonly name = input<string>();
  readonly value = input<string>();
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly form = input<string>();
  readonly tabStop = input(true, { transform: booleanAttribute });
  readonly click = output<void>();

  protected readonly inert = computed(() => this.disabled() || this.loading());
  protected readonly styles = computed(() => buttonStyles({
    variant: this.variant(), size: this.size(), full: this.full(),
  }));

  private readonly control = viewChild<ElementRef<HTMLButtonElement>>('control');

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.control()?.nativeElement.focus();
    });
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.inert()) this.click.emit();
  }
}
