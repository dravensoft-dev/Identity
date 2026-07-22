import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { onboardingStyles } from './onboarding.variants';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../focus-trap';
import { onboardingWidth, sp3, sp4 } from '../../tokens.generated';

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
 *  never reaches the host's scrim listener.
 *
 *  Modal by assertion and by behaviour, not just by assertion: because the
 *  panel carries `aria-modal="true"`, focus moves into it on open and is
 *  restored to whatever held it beforehand on close, Tab/Shift+Tab cycle
 *  within the panel rather than walking into the page behind the scrim, and
 *  Escape reports dismissal through the same `skip` output the scrim click
 *  and the Skip button already use. This reuses `arena-confirm-dialog`'s
 *  focus contract through the shared
 *  `frameworks/angular/primitives/focus-trap.ts`
 *  (`handleOpenTransition`, `trapTabKey`) rather than a second
 *  implementation. React's `Onboarding.jsx` has none of it -- see
 *  `components-divergences.md`. */
@Component({
  selector: 'arena-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '(click)': 'onScrimClick()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    @if (visible()) {
      <div #panel [class]="styles().panel()" role="dialog" aria-modal="true" tabindex="-1"
           [attr.aria-label]="label()"
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
  readonly open = input(false, { transform: booleanAttribute });
  readonly steps = input<ArenaOnboardingStep[]>([]);
  readonly index = input(0);
  readonly anchorRect = input<DOMRect>();
  readonly next = output<void>();
  readonly back = output<void>();
  readonly skip = output<void>();
  readonly done = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

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
   *  and `EDGE` are still real numbers, the same reason `Onboarding.jsx`
   *  states: `Math.min`/`Math.max` need real numbers. Both are authored once
   *  in tokens/src/ now instead of here and in React's copy. */
  protected readonly position = computed(() => {
    const rect = this.anchorRect();
    if (!rect) return null;
    const view = this.doc.defaultView;
    const W = onboardingWidth;
    const EDGE = sp4;
    const top = Math.min(rect.bottom + sp3, (view?.innerHeight ?? 900) - 220);
    const left = view ? Math.min(rect.left, view.innerWidth - W - EDGE) : rect.left;
    return { top, left: Math.max(EDGE, left) };
  });

  /** Bookkeeping `handleOpenTransition` mutates across renders -- a plain
   *  object rather than a signal, matching `arena-confirm-dialog`'s and
   *  `arena-command-palette`'s own field, for the identical reason: reading
   *  it inside the effect below must never register as a dependency, or
   *  writing it there would make the effect re-run itself. */
  private readonly focusTrap: FocusTrapState = { wasOpen: false, restoreTo: null };

  constructor() {
    afterRenderEffect(() => {
      // `visible()`, not `open()`: an `open` tour with no steps renders no
      // panel at all, so there is nothing to move focus into and nothing
      // for the user to have escaped from on the way back out.
      const isOpen = this.visible();
      untracked(() => {
        handleOpenTransition(this.focusTrap, isOpen, this.panel()?.nativeElement ?? null, this.doc.activeElement);
      });
    });
  }

  protected onScrimClick(): void {
    if (this.visible()) this.skip.emit();
  }

  /** Escape routes to `skip` -- the tour's existing dismissal, the same one
   *  the scrim click and the Skip button report -- rather than inventing a
   *  second close path the host would have to wire separately. */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.visible()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.skip.emit();
      return;
    }
    if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapTabKey(panel, event, this.doc.activeElement);
    }
  }
}
