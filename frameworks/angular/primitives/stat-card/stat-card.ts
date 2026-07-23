import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { statCardStyles } from './stat-card.variants';
import type { Tone, StatDelta } from '../../api.generated';

/** One metric on a dashboard: a micro-label, the number, and an optional delta pill.
 *  `tone` and `delta.tone` answer different questions about the same number. `tone`
 *  says what state the number IS in right now — a service at 99.98% uptime is
 *  healthy whether or not it improved this week, and two open incidents are two
 *  open incidents even when that is down from five. `delta.tone` says whether the
 *  change it just made was good; `delta.direction` says which way it pointed. Both
 *  are separate fields of one `StatDelta` object because they are separate facts,
 *  and every delta sign renders as an outline pill, never filled. The pill itself
 *  gates on `delta()?.value` — matching React exactly, since both layers now read
 *  the same contract member (`api/components/StatCard.json`).
 *
 *  `delta` is a single `input<StatDelta>()` rather than three flat `input()`s, per
 *  the API contract's Reshape A. That is a real cost, not a free win: a consumer
 *  must hand a fresh object identity to change one field. Only `tone`'s per-field
 *  default moves this way, into the `??` fallback `styles` applies
 *  (`this.delta()?.tone ?? 'neutral'`) — `direction` has none to move: it is
 *  `required: true` on `StatDelta` (`api/types/stat-delta.json`), so a delta with
 *  no direction is not a contracted shape to default around. The template's own
 *  `delta()?.direction === 'down' ? … : …` ternary reads as a fallback but is not
 *  one: it treats every non-`'down'` value as `'up'`, which is simply "the arrow
 *  points up unless told otherwise," not a default value substituted for an
 *  absent one. The contract overrules the object-identity objection rather than
 *  refuting it — one member surface across both layers is worth more than the
 *  per-field ergonomics three flat inputs gave Angular alone. The host itself is
 *  the recipe's `root` — it is the flex item a
 *  parent row lays out, so root-level classes must live on the host, not one
 *  element inside it. `icon` is a slot (`<ng-content select="[icon]" />`), not an
 *  input: Arena still renders the aria-hidden wrapper span, and only the glyph
 *  inside it comes from the consumer, matching `arena-app-logo`'s `mark` slot.
 *
 *  The old `@if (icon(); as glyph)` gate came from `icon` being a primitive
 *  input the component could inspect; a slot has nothing to inspect the same
 *  way -- `contentChild` can detect projected content, but only under a real
 *  `ngtsc` build, and reaching for it here would need a new marker directive
 *  for one aria-hidden, zero-footprint span. The wrapper renders
 *  unconditionally instead, the same choice `arena-app-logo` already made for
 *  its own (required) `mark` slot: it is `inline-flex` with no min-width and
 *  no padding, so an unfilled slot collapses to a zero-width box that changes
 *  nothing onscreen, and `aria-hidden="true"` keeps it silent for assistive
 *  tech either way. */
@Component({
  selector: 'arena-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'styles().root()' },
  template: `
    <div [class]="styles().head()">
      <span [class]="styles().label()">{{ label() }}</span>
      <span [class]="styles().icon()" aria-hidden="true"><ng-content select="[icon]" /></span>
    </div>
    <div [class]="styles().value()">{{ value() }}</div>
    @if (delta()?.value; as amount) {
      <span [class]="styles().delta()">
        <i [class]="delta()?.direction === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'" aria-hidden="true"></i>
        {{ amount }}
      </span>
    }
    @if (sub(); as caption) {
      <span [class]="styles().sub()">{{ caption }}</span>
    }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly tone = input<Tone>('neutral');
  readonly delta = input<StatDelta>();
  readonly sub = input<string>();

  protected readonly styles = computed(() => statCardStyles({ tone: this.tone(), deltaTone: this.delta()?.tone ?? 'neutral' }));
}
