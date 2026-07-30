import {
  ChangeDetectionStrategy, Component, ElementRef, afterNextRender, booleanAttribute, computed,
  input, output, viewChild,
} from '@angular/core';
import type { ButtonType, ControlSize, IconButtonVariant } from '../../../Api.generated';
import { iconButtonStyles } from './IconButton.variants';

@Component({
  selector: 'arena-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button #control [class]="styles().root()" [attr.type]="type()" [disabled]="disabled()"
            [attr.name]="name()" [attr.value]="value()" [attr.form]="form()"
            [attr.tabindex]="tabStop() ? null : -1"
            [attr.aria-label]="label()" [attr.title]="showLabel() ? null : label()"
            (click)="onClick($event)">
      <i [class]="icon()" aria-hidden="true"></i>
      @if (showLabel()) {
        <span [class]="styles().label()">{{ label() }}</span>
      }
    </button>
  `,
})
export class IconButton {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly size = input<ControlSize>('md');
  readonly variant = input<IconButtonVariant>('ghost');
  readonly showLabel = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<ButtonType>('button');
  readonly name = input<string>();
  readonly value = input<string>();
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly form = input<string>();
  readonly tabStop = input(true, { transform: booleanAttribute });
  readonly click = output<void>();

  protected readonly styles = computed(() => iconButtonStyles({
    variant: this.variant(), size: this.size(), showLabel: this.showLabel(),
  }));

  private readonly control = viewChild<ElementRef<HTMLButtonElement>>('control');

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.control()?.nativeElement.focus();
    });
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled()) this.click.emit();
  }
}
