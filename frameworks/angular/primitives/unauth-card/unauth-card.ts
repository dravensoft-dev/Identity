import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { ArenaBrand, ArenaFooter } from '../projection-markers';
import { unauthCardStyles } from './unauth-card.variants';

/** The panel a signed-out screen needs — a frame, never the form. It knows nothing
 *  about credentials, so one component serves sign-in, "check your inbox", "this
 *  link expired" and two-factor entry; fields are composed inside it from
 *  Material's form controls. It does NOT centre itself — the product owns the
 *  page. The host is the recipe's `root`, the flex item a parent lays out; the
 *  `[brand]` and `[footer]` wrappers each carry their own margin and render only
 *  when something was actually projected into them, matching React's own
 *  `{brand && <div>...}` / `{footer && <div>...}` gates — the same fix
 *  `EmptyState`/`ErrorState` shipped for their action slot. */
@Component({
  selector: 'arena-unauth-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
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
  readonly eyebrow = input<string>();
  readonly title = input<string>();

  protected readonly brand = contentChild(ArenaBrand);
  protected readonly footer = contentChild(ArenaFooter);

  protected readonly styles = computed(() => unauthCardStyles());
}
