import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, contentChild, input, output,
} from '@angular/core';
import { ArenaAction } from '../../../ProjectionMarkers';
import { cardStyles } from './Card.variants';

@Component({
  selector: 'arena-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '[attr.title]': 'null',
  },
  template: `
    <div [class]="styles().root()" [attr.role]="role()" [attr.tabindex]="stop()"
         [attr.aria-disabled]="inert()" (click)="onClick($event)" (keydown)="onKeydown($event)">
      @if (headed()) {
        <div [class]="styles().head()">
          <div>
            @if (eyebrow(); as label) {
              <div [class]="styles().eyebrow()">{{ label }}</div>
            }
            @if (title(); as heading) {
              <div [class]="styles().title()">{{ heading }}</div>
            }
          </div>
          <ng-content select="[action]" />
        </div>
      }
      <div [class]="styles().body()"><ng-content /></div>
    </div>
  `,
})
export class Card {
  readonly title = input<string>();
  readonly eyebrow = input<string>();
  readonly floating = input(false, { transform: booleanAttribute });
  readonly accent = input(false, { transform: booleanAttribute });
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly click = output<void>();

  protected readonly action = contentChild(ArenaAction);

  protected readonly headed = computed(() => Boolean(this.title() || this.eyebrow() || this.action()));

  protected readonly role = computed(() => (this.interactive() ? 'button' : null));

  protected readonly stop = computed(() => (this.interactive() ? 0 : null));

  protected readonly inert = computed(() => (this.interactive() && this.disabled() ? 'true' : null));

  protected readonly styles = computed(() => cardStyles({
    accent: this.accent(), floating: this.floating(), interactive: this.interactive(),
  }));

  protected onClick(event: MouseEvent): void {
    if (!this.interactive()) return;
    event.stopPropagation();
    this.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.interactive() || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    this.emit();
  }

  private emit(): void {
    if (!this.disabled()) this.click.emit();
  }
}
