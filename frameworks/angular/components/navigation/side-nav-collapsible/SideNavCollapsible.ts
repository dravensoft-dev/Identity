import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, contentChildren, effect,
  forwardRef, inject, input, output, signal, untracked,
} from '@angular/core';
import { SideNavChild, SideNavState, indentFor } from '../side-nav/SideNavState';
import { sideNavStyles } from '../side-nav/SideNav.variants';
import { SideNavItem } from '../side-nav-item/SideNavItem';

@Component({
  selector: 'arena-side-nav-collapsible',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SideNavState,
    { provide: SideNavChild, useExisting: forwardRef(() => SideNavCollapsible) },
  ],
  host: {
    '[class]': 'styles().section()',
  },
  template: `
    <button type="button" [id]="triggerId()" [class]="styles().trigger()"
            [style.paddingInlineStart]="indent()"
            [attr.aria-expanded]="expanded()" [attr.aria-controls]="regionId()"
            (click)="press()" (keydown)="onKeydown($event)">
      @if (icon(); as glyph) {
        <i [class]="styles().icon() + ' ' + glyph" aria-hidden="true"></i>
      }
      <span [class]="styles().triggerLabel()">{{ heading() }}</span>
      <i [class]="styles().caret() + ' ' + caretGlyph()" aria-hidden="true"></i>
    </button>
    <div [id]="regionId()" [class]="styles().region()" role="group"
         [attr.aria-labelledby]="triggerId()" [hidden]="!expanded()">
      <ng-content />
    </div>
  `,
})
export class SideNavCollapsible {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly defaultExpanded = input(false, { transform: booleanAttribute });
  readonly toggle = output<boolean>();

  private readonly parent = inject(SideNavState, { skipSelf: true });
  private readonly own = inject(SideNavState);
  private readonly items = contentChildren(SideNavItem, { descendants: true });
  private readonly open = signal<boolean | null>(null);

  protected readonly triggerId = computed(() => `${this.key()}-trigger`);
  protected readonly regionId = computed(() => `${this.key()}-region`);
  protected readonly expanded = computed(() => this.open() ?? (this.defaultExpanded() || this.holdsActive()));
  protected readonly caretGlyph = computed(() => (this.expanded() ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'));

  protected readonly holdsActive = computed(() => {
    const active = this.parent.activeId();
    return active !== undefined && this.items().some((item) => item.id() === active);
  });

  protected readonly heading = computed(() => {
    const text = this.label();
    if (text.trim() === '') {
      throw new Error('SideNavCollapsible: `label` is required, and names the group its trigger opens');
    }
    return text;
  });

  protected readonly indent = computed(() => indentFor(this.parent.indentStep(), this.parent.depth()));
  protected readonly styles = computed(() => sideNavStyles());

  constructor() {
    this.own.depth = computed(() => this.parent.depth() + 1);
    this.own.activeId = this.parent.activeId;
    this.own.indentStep = this.parent.indentStep;
    this.own.activate = (id: string) => this.parent.activate(id);

    effect(() => {
      const holds = this.holdsActive();
      untracked(() => {
        if (holds) this.open.set(true);
      });
    });
  }

  protected press(): void {
    const next = !this.expanded();
    this.open.set(next);
    this.toggle.emit(next);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.press();
  }

  private key(): string {
    const id = this.id();
    if (id.trim() === '') {
      throw new Error('SideNavCollapsible: `id` is required, and is what its trigger and its region are named from');
    }
    return id;
  }
}
