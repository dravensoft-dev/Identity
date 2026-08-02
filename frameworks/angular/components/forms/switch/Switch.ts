import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output,
} from '@angular/core';
import type { Orientation, SwitchSize } from '../../../Api.generated';
import { switchStyles } from './Switch.variants';

export type SwitchFootprint = `${Orientation}-${SwitchSize}`;
export type SwitchThumb = `${'on' | 'off'}-${Orientation}`;

export function footprintFor(orientation: Orientation, size: SwitchSize): SwitchFootprint {
  return `${orientation}-${size}`;
}

export function thumbFor(state: boolean, orientation: Orientation): SwitchThumb {
  return `${state ? 'on' : 'off'}-${orientation}`;
}

@Component({
  selector: 'arena-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <button type="button" role="switch" [class]="styles().track()"
            [attr.aria-checked]="state()" [attr.aria-label]="label()"
            [disabled]="disabled()" (click)="activate()">
      <span [class]="styles().knob()" aria-hidden="true">
        @if (glyph()) {
          <i [class]="glyphClass()" aria-hidden="true"></i>
        }
      </span>
    </button>
    <span [class]="styles().label()" (click)="activate()">
      {{ label() }}
      @if (confirm()) {
        <i [class]="guardClass()" aria-hidden="true" title="Requires confirmation"></i>
      }
    </span>
  `,
})
export class Switch {
  /** The current on/off value. Controlled: the consumer owns it and pushes it each render. */
  readonly state = input(false, { transform: booleanAttribute });
  /** Whether the switch lies horizontally or stands vertically. */
  readonly orientation = input<Orientation>('horizontal');
  /** The switch's overall size. */
  readonly size = input<SwitchSize>('md');
  /** A Phosphor class name for the glyph shown while on. Arena draws the aria-hidden `<i>`. */
  readonly iconOn = input<string>();
  /** A Phosphor class name for the glyph shown while off. */
  readonly iconOff = input<string>();
  /** The accessible name for the switch, also drawn beside it. */
  readonly label = input.required<string>();
  /** Whether the switch is inoperable. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** When set, a change is not applied on the fly; it is requested through `requestChange` so the host can confirm it first. */
  readonly confirm = input(false, { transform: booleanAttribute });
  /** The switch was turned on. */
  readonly funcOn = output<void>();
  /** The switch was turned off. */
  readonly funcOff = output<void>();
  /** A change was requested while `confirm` is set: the host opens a ConfirmDialog and, on confirmation, flips `state` (the requested value is always the negation of the current one). */
  readonly requestChange = output<void>();

  protected readonly glyph = computed(() => (this.state() ? this.iconOn() : this.iconOff()));

  protected readonly styles = computed(() => switchStyles({
    size: this.size(),
    orientation: this.orientation(),
    checked: this.state(),
    disabled: this.disabled(),
    footprint: footprintFor(this.orientation(), this.size()),
    thumb: thumbFor(this.state(), this.orientation()),
  }));

  protected readonly glyphClass = computed(() => `${this.styles().icon()} ${this.glyph() ?? ''}`.trim());
  protected readonly guardClass = computed(() => `ph-bold ph-shield-check ${this.styles().guard()}`);

  protected activate(): void {
    if (this.disabled()) return;
    if (this.confirm()) {
      this.requestChange.emit();
      return;
    }
    if (this.state()) this.funcOff.emit();
    else this.funcOn.emit();
  }
}
