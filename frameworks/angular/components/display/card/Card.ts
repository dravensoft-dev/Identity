import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, contentChild, input,
} from '@angular/core';
import { ArenaAction } from '../../../ProjectionMarkers';
import { cardStyles } from './Card.variants';

@Component({
  selector: 'arena-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
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
  `,
})
export class Card {
  readonly title = input<string>();
  readonly eyebrow = input<string>();
  readonly floating = input(false, { transform: booleanAttribute });
  readonly accent = input(false, { transform: booleanAttribute });

  protected readonly action = contentChild(ArenaAction);

  protected readonly headed = computed(() => Boolean(this.title() || this.eyebrow() || this.action()));

  protected readonly styles = computed(() => cardStyles({ accent: this.accent(), floating: this.floating() }));
}
