import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { avatarStyles } from './avatar.variants';

type Size = 'xs' | 'sm' | 'md' | 'lg';
type Shape = 'circle' | 'rounded';
type Status = 'online' | 'busy' | 'away' | 'offline';

/** Person or entity mark — the image when `src` is set, initials from `name` otherwise. */
@Component({
  selector: 'arena-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="styles().root()">
      <span [class]="styles().box()">
        @if (src(); as source) {
          <img [src]="source" [alt]="name()" [class]="styles().image()" />
        } @else {
          {{ initials() }}
        }
      </span>
      @if (status(); as presence) {
        <span [class]="styles().status()" [attr.aria-label]="presence" [title]="presence"></span>
      }
    </span>
  `,
})
export class Avatar {
  readonly src = input<string>();
  readonly name = input('');
  readonly size = input<Size>('md');
  readonly shape = input<Shape>('circle');
  readonly status = input<Status>();

  protected readonly styles = computed(() =>
    avatarStyles({ size: this.size(), shape: this.shape(), status: this.status() ?? 'none' }));

  protected readonly initials = computed(() =>
    this.name().trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? '').join('').toUpperCase());
}
