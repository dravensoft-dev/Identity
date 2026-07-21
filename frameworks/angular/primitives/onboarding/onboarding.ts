import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject, input, output } from '@angular/core';
import { onboardingStyles } from './onboarding.variants';

/** One step of an `arena-onboarding` tour. All three fields are optional so a
 *  step can carry only the ones it needs -- React's `Onboarding.jsx` renders
 *  each conditionally for the same reason. */
export interface ArenaOnboardingStep {
  eyebrow?: string;
  title?: string;
  body?: string;
}

/** Guided coachmark tour (H10). Presents features within the product with
 *  progress dots, "Skip" and "Next" -- controlled: the host owns `index` and
 *  answers `next`, `back`, `skip` and `done`. Floats bottom-right over an
 *  unblurred scrim by default, or anchors next to `anchorRect` (a
 *  `DOMRect`, usually from `getBoundingClientRect()`), clamped inside the
 *  viewport. The host is the recipe's `root`, the fixed full-viewport scrim
 *  -- `open` drives it between the overlay and `hidden` rather than a
 *  wrapper element omitting itself, matching `arena-confirm-dialog`. Unlike
 *  that dialog, this scrim IS dismissible: clicking it reports `skip`, the
 *  same as React's `onClick={onSkip}` on its own scrim div. Because the
 *  panel is a descendant of the host here (React renders scrim and panel as
 *  siblings), a click inside the panel stops its own propagation so it
 *  never reaches the host's scrim listener. */
@Component({
  selector: 'arena-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '(click)': 'onScrimClick()',
  },
  template: `
    @if (visible()) {
      <div [class]="styles().panel()" role="dialog" aria-modal="true" [attr.aria-label]="label()"
           (click)="$event.stopPropagation()"
           [style.top.px]="position()?.top" [style.left.px]="position()?.left">
        @if (step().eyebrow; as eyebrow) {
          <div [class]="styles().eyebrow()">{{ eyebrow }}</div>
        }
        @if (step().title; as title) {
          <div [class]="styles().title()">{{ title }}</div>
        }
        @if (step().body; as body) {
          <div [class]="styles().body()">{{ body }}</div>
        }
        <div [class]="styles().foot()">
          <div [class]="styles().dots()" [attr.aria-label]="'Step ' + (index() + 1) + ' of ' + steps().length">
            @for (dot of steps(); track $index) {
              <span [class]="styles().dot() + ' ' + ($index === index() ? styles().dotOn() : styles().dotOff())"></span>
            }
          </div>
          @if (index() > 0) {
            <button type="button" [class]="styles().text()" (click)="back.emit()">Back</button>
          }
          @if (!last()) {
            <button type="button" [class]="styles().text()" (click)="skip.emit()">Skip</button>
          }
          <button type="button" [class]="styles().next()" (click)="last() ? done.emit() : next.emit()">
            {{ last() ? 'Got it' : 'Next' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class Onboarding {
  readonly open = input(false);
  readonly steps = input<ArenaOnboardingStep[]>([]);
  readonly index = input(0);
  readonly anchorRect = input<DOMRect>();
  readonly next = output<void>();
  readonly back = output<void>();
  readonly skip = output<void>();
  readonly done = output<void>();

  private readonly doc = inject(DOCUMENT);

  protected readonly visible = computed(() => this.open() && this.steps().length > 0);
  protected readonly step = computed<ArenaOnboardingStep>(() => this.steps()[this.index()] ?? {});
  protected readonly last = computed(() => this.index() === this.steps().length - 1);

  /** The dialog's accessible name. Falls back through `title` to `eyebrow`
   *  to a generic step count rather than React's bare `step.title`, which
   *  renders `role="dialog"` with no name at all on a step that omits
   *  `title` -- see `components-divergences.md`. */
  protected readonly label = computed(() => {
    const current = this.step();
    return current.title ?? current.eyebrow ?? `Step ${this.index() + 1} of ${this.steps().length}`;
  });

  protected readonly styles = computed(() => onboardingStyles({
    placement: this.anchorRect() ? 'anchored' : 'floating',
    open: this.open(),
  }));

  /** Clamped against the viewport, or null when the coachmark floats. `W`
   *  and `EDGE` stay plain numbers for the reason `Onboarding.jsx` states:
   *  `Math.min`/`Math.max` need real numbers, and nothing in this layer
   *  reads a custom property back into JS. */
  protected readonly position = computed(() => {
    const rect = this.anchorRect();
    if (!rect) return null;
    const view = this.doc.defaultView;
    const W = 320;
    const EDGE = 16;
    const top = Math.min(rect.bottom + 12, (view?.innerHeight ?? 900) - 220);
    const left = view ? Math.min(rect.left, view.innerWidth - W - EDGE) : rect.left;
    return { top, left: Math.max(EDGE, left) };
  });

  protected onScrimClick(): void {
    if (this.visible()) this.skip.emit();
  }
}
