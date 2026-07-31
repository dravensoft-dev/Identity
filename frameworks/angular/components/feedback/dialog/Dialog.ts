import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { ArenaFooter } from '../../../ProjectionMarkers';
import { dialogStyles } from './Dialog.variants';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../../../FocusTrap';

let nextId = 0;

@Component({
  selector: 'arena-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().scrim()',
    '(click)': 'onScrimClick()',
    '(keydown)': 'onKeydown($event)',
    '[attr.title]': 'null',
  },
  template: `
    @if (open()) {
      <div #panel [class]="styles().panel()" role="dialog" aria-modal="true" tabindex="-1"
           [attr.aria-labelledby]="titleId" [style.width]="width()"
           (click)="$event.stopPropagation()">
        <div [class]="styles().head()">
          @if (eyebrow(); as label) {
            <div [class]="styles().eyebrow()">{{ label }}</div>
          }
          <div [id]="titleId" [class]="styles().title()">{{ title() }}</div>
        </div>
        <div [class]="styles().body()"><ng-content /></div>
        @if (footer()) {
          <div [class]="styles().foot()"><ng-content select="[footer]" /></div>
        }
      </div>
    }
  `,
})
export class Dialog {
  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });

  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly width = input<string>();
  readonly close = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly titleId = `arena-dialog-${nextId++}-title`;
  protected readonly footer = contentChild(ArenaFooter);
  protected readonly styles = computed(() => dialogStyles({ open: this.open() }));

  private readonly focusTrap: FocusTrapState = { wasOpen: false, restoreTo: null };

  constructor() {
    afterRenderEffect(() => {
      const isOpen = this.open();
      untracked(() => {
        handleOpenTransition(this.focusTrap, isOpen, this.panel()?.nativeElement ?? null, this.doc.activeElement);
      });
    });
  }

  protected onScrimClick(): void {
    if (this.open()) this.close.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }
    if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapTabKey(panel, event, this.doc.activeElement);
    }
  }
}
