import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaBrand, ArenaFooter } from '../../../ProjectionMarkers';
import { unauthCardStyles } from './UnauthCard.variants';

@Component({
  selector: 'arena-unauth-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '[attr.title]': 'null',
  },
  template: `
    <div [class]="styles().panel()">
      <div [class]="styles().body()">
        @if (brand()) {
          <div [class]="styles().brand()"><ng-content select="[brand]" /></div>
        }
        @if (eyebrow(); as label) {
          <div [class]="styles().eyebrow()">{{ label }}</div>
        }
        @if (title(); as heading) {
          <div [class]="styles().title()">{{ heading }}</div>
        }
        <ng-content />
        @if (footer()) {
          <div [class]="styles().footer()"><ng-content select="[footer]" /></div>
        }
      </div>
    </div>
  `,
})
export class UnauthCard {
  /** Mono crimson microlabel: the product, not the task. */
  readonly eyebrow = input<string>();
  /** The task. "Welcome back", "Check your inbox". */
  readonly title = input<string>();

  protected readonly brand = contentChild(ArenaBrand);
  protected readonly footer = contentChild(ArenaFooter);

  protected readonly styles = computed(() => unauthCardStyles());
}
