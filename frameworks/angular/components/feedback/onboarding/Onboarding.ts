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
import { onboardingStyles } from './Onboarding.variants';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../../../FocusTrap';
import { onboardingWidth, sp3, sp4 } from '../../../Tokens.generated';
import type { OnboardingAnchor, OnboardingStep } from '../../../Api.generated';

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
  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });
  readonly steps = input.required<OnboardingStep[]>();
  readonly index = input(0);
  readonly anchor = input<OnboardingAnchor>();
  readonly next = output<void>();
  readonly back = output<void>();
  readonly skip = output<void>();
  readonly done = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly visible = computed(() => this.open() && this.steps().length > 0);
  protected readonly step = computed<OnboardingStep>(() => this.steps()[this.index()] ?? {});
  protected readonly last = computed(() => this.index() === this.steps().length - 1);

  protected readonly label = computed(() => {
    const current = this.step();
    return current.title ?? current.eyebrow ?? `Step ${this.index() + 1} of ${this.steps().length}`;
  });

  protected readonly styles = computed(() => onboardingStyles({
    placement: this.anchor() ? 'anchored' : 'floating',
    open: this.open(),
  }));

  protected readonly position = computed(() => {
    const rect = this.anchor();
    if (!rect) return null;
    const view = this.doc.defaultView;
    const W = onboardingWidth;
    const EDGE = sp4;
    const top = Math.min(rect.bottom + sp3, (view?.innerHeight ?? 900) - 220);
    const left = view ? Math.min(rect.left, view.innerWidth - W - EDGE) : rect.left;
    return { top, left: Math.max(EDGE, left) };
  });

  private readonly focusTrap: FocusTrapState = { wasOpen: false, restoreTo: null };

  constructor() {
    afterRenderEffect(() => {

      const isOpen = this.visible();
      untracked(() => {
        handleOpenTransition(this.focusTrap, isOpen, this.panel()?.nativeElement ?? null, this.doc.activeElement);
      });
    });
  }

  protected onScrimClick(): void {
    if (this.visible()) this.skip.emit();
  }

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
