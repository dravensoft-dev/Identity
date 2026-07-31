import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterRenderEffect, booleanAttribute,
  computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import type { CatSlot } from '../../../Api.generated';
import { catColor } from '../../../DataVisuals';
import { IconButton } from '../../forms/icon-button/IconButton';
import { CalendarState } from '../calendar/CalendarState';
import { formatDate, formatHM, showsTime, stacksActions } from '../calendar/CalendarInternals';
import { calendarEventStyles } from './CalendarEvent.variants';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let seq = 0;

@Component({
  selector: 'arena-calendar-event',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconButton],
  host: { style: 'display: contents', '[attr.title]': 'null' },
  template: `
    @if (across(); as across) {
      @if (hasPanel()) {
        <div [id]="domId" [class]="chipClass()" [style]="across"
             [style.top.px]="topPx()" [style.height.px]="heightPx()"
             [style.background]="tint()" [style.borderLeftColor]="ink()"
             (keydown)="onKeydown($event)">
          <button #focusable type="button" tabindex="-1" [class]="bodyClass()"
                  [attr.aria-label]="label()" [attr.aria-disabled]="inert()"
                  (click)="onActivate($event)">
            <span [class]="styles().title()">{{ heading() }}</span>
            @if (showTime()) {
              <span [class]="styles().time()">{{ timeLabel() }}</span>
            }
          </button>
          <span #kebabWrap [class]="kebabClass()">
            <arena-icon-button icon="ph-bold ph-dots-three-vertical" label="Actions" size="sm"
                               [tabStop]="false" (click)="togglePanel()" />
            @if (panelOpen()) {
              <span #panel [class]="styles().panel()" [style.zIndex]="1">
                <ng-content select="[actions]" />
              </span>
            }
          </span>
        </div>
      } @else {
        <button #focusable [id]="domId" type="button" tabindex="-1" [class]="chipClass()"
                [style]="across" [style.top.px]="topPx()" [style.height.px]="heightPx()"
                [style.background]="tint()" [style.borderLeftColor]="ink()"
                [attr.aria-label]="label()" [attr.aria-disabled]="inert()"
                (click)="onActivate($event)">
          <span [class]="styles().title()">{{ heading() }}</span>
          @if (showTime()) {
            <span [class]="styles().time()">{{ timeLabel() }}</span>
          }
        </button>
      }
    }
  `,
})
export class CalendarEvent {
  readonly id = input.required<string>();
  readonly title = input.required<string>();
  readonly start = input.required<string>();
  readonly end = input.required<string>();
  readonly colorId = input<CatSlot>();
  readonly actionsEnabled = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly click = output<void>();

  protected readonly domId = `arena-calendar-event-${seq++}`;

  private readonly state = inject(CalendarState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusable = viewChild<ElementRef<HTMLElement>>('focusable');
  private readonly kebabWrap = viewChild<ElementRef<HTMLElement>>('kebabWrap');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private openedByUser = false;

  protected readonly panelOpen = signal(false);

  protected readonly hasPanel = computed(() => this.actionsEnabled());

  private readonly placement = computed(() => this.state.placementOf(this));

  protected readonly topPx = computed(() => {
    const at = this.placement();
    return at ? this.state.y(at.startMin) : 0;
  });

  protected readonly heightPx = computed(() => {
    const at = this.placement();
    return at ? this.state.y(at.endMin) - this.state.y(at.startMin) : 0;
  });

  protected readonly across = computed(() => {
    const at = this.placement();
    if (!at) return null;
    const columns = this.state.days().length;
    const leftShare = ((at.dayIndex + at.col / at.cols) / columns) * 100;
    const widthShare = (1 / (at.cols * columns)) * 100;
    return {
      left: `calc(${leftShare}% + calc(var(--sp-1) * 0.5))`,
      width: `calc(${widthShare}% - var(--sp-1))`,
    };
  });

  protected readonly showTime = computed(() => {
    const at = this.placement();
    return at !== null && showsTime(this.heightPx(), this.state.slotWidth(at.cols));
  });

  protected readonly actionsBelow = computed(() => {
    const at = this.placement();
    return at !== null && stacksActions(this.heightPx(), this.state.slotWidth(at.cols));
  });

  protected readonly ink = computed(() => catColor(this.colorId() ?? 1));

  protected readonly tint = computed(
    () => `color-mix(in oklab, ${this.ink()} 16%, var(--surface-card))`,
  );

  protected readonly timeLabel = computed(() => {
    const at = this.placement();
    return at ? `${formatHM(at.startMin)} – ${formatHM(at.endMin)}` : '';
  });

  protected readonly label = computed(() => {
    const at = this.placement();
    if (!at) return null;
    const day = formatDate(at.dayIso, { weekday: 'long', day: 'numeric', month: 'long' });
    return `${this.heading()}, ${day}, ${this.timeLabel()}`;
  });

  protected readonly inert = computed(() => (this.disabled() ? 'true' : null));

  protected readonly heading = computed(() => {
    for (const [member, value] of [
      ['id', this.id()], ['title', this.title()], ['start', this.start()], ['end', this.end()],
    ] as const) {
      if (value.trim() === '') throw new Error(`CalendarEvent: \`${member}\` is required`);
    }
    return this.title();
  });

  protected readonly styles = computed(() => calendarEventStyles());

  protected readonly chipClass = computed(() => calendarEventStyles({
    reserve: this.hasPanel() && !this.actionsBelow(),
    panelOpen: this.panelOpen(),
    clickable: !this.disabled(),
    disabled: this.disabled(),
  }).chip());

  protected readonly bodyClass = computed(
    () => calendarEventStyles({ disabled: this.disabled() }).chipBody(),
  );

  protected readonly kebabClass = computed(
    () => calendarEventStyles({ actionsBelow: this.actionsBelow() }).kebabWrap(),
  );

  constructor() {
    this.state.register(this, {
      domId: this.domId,
      focus: () => this.focusable()?.nativeElement.focus(),
    });
    this.destroyRef.onDestroy(() => this.state.release(this));

    afterRenderEffect(() => {
      if (!this.panelOpen() || !this.openedByUser) return;
      this.openedByUser = false;
      this.panel()?.nativeElement.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
  }

  protected togglePanel(): void {
    this.openedByUser = !this.panelOpen();
    this.panelOpen.update((open) => !open);
  }

  protected onActivate(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled()) this.click.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const kebab = this.kebabWrap()?.nativeElement.querySelector<HTMLElement>('button');
    if (event.key === 'Escape' && this.panelOpen()) {
      event.stopPropagation();
      this.panelOpen.set(false);
      kebab?.focus();
      return;
    }
    if (!kebab) return;
    if (event.key === 'ArrowRight' && event.target !== kebab) {
      event.preventDefault();
      event.stopPropagation();
      kebab.focus();
    } else if (event.key === 'ArrowLeft' && event.target === kebab) {
      event.preventDefault();
      event.stopPropagation();
      this.focusable()?.nativeElement.focus();
    }
  }
}
