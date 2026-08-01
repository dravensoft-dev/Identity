import { ChangeDetectionStrategy, Component, booleanAttribute, computed, forwardRef, inject, input } from '@angular/core';
import { SideNavChild, SideNavState, indentFor } from '../side-nav/SideNavState';
import { sideNavStyles } from '../side-nav/SideNav.variants';

@Component({
  selector: 'arena-side-nav-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SideNavChild, useExisting: forwardRef(() => SideNavItem) }],
  host: {
    style: 'display: contents',
    '[attr.id]': 'null',
  },
  template: `
    @if (href(); as url) {
      <a [class]="styles().item()" [href]="url" [style.paddingInlineStart]="indent()"
         [attr.aria-current]="current()" [attr.aria-disabled]="off()"
         (click)="activate($event)">
        @if (icon(); as glyph) {
          <i [class]="styles().icon() + ' ' + glyph" aria-hidden="true"></i>
        }
        {{ name() }}
      </a>
    } @else {
      <button type="button" [class]="styles().item()" [style.paddingInlineStart]="indent()"
              [attr.aria-current]="current()" [attr.aria-disabled]="off()"
              (click)="activate($event)">
        @if (icon(); as glyph) {
          <i [class]="styles().icon() + ' ' + glyph" aria-hidden="true"></i>
        }
        {{ name() }}
      </button>
    }
  `,
})
export class SideNavItem {
  /** Identifies the destination. SideNav.active names one of these, and the item whose id matches is the one marked aria-current="page". Required, and guarded with a falsy check rather than an absence check: a blank id can never match and is an omission wearing a value. */
  readonly id = input.required<string>();
  /** What the item reads, and its whole accessible name. Required and falsy-guarded for the same reason. */
  readonly label = input.required<string>();
  /** A Phosphor class name drawn before the label -- Arena draws the <i>, the consumer names the glyph. */
  readonly icon = input<string>();
  /** Present => the item renders an <a>; absent => a <button>. A control that navigates must be a link -- openable in a new tab, address copyable, announced as a link. An item that only changes local state is a button. */
  readonly href = input<string>();
  /** Whether the destination is drawn but cannot be reached -- one the consumer's rules lock, such as a feature the current plan does not include. It reflects through `aria-disabled` rather than the native attribute, and rather than by not rendering the item at all: an unavailable destination a user can see and hear announced as unavailable is what tells them it exists, which is the whole reason to draw it. The anchor keeps its `href` so the case split stays what it is -- what changes is that activation is refused and the state is announced. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly nav = inject(SideNavState);

  protected readonly name = computed(() => {
    const text = this.label();
    if (text.trim() === '') {
      throw new Error('SideNavItem: `label` is required, and names the destination this row leads to');
    }
    return text;
  });

  protected readonly on = computed(() => {
    const key = this.id();
    if (key.trim() === '') {
      throw new Error('SideNavItem: `id` is required, and is what `active` and `nav` identify this row by');
    }
    return key === this.nav.activeId();
  });

  protected readonly current = computed(() => (this.on() ? 'page' : null));
  protected readonly indent = computed(() => indentFor(this.nav.indentStep(), this.nav.depth()));
  protected readonly styles = computed(() => sideNavStyles({ active: this.on() }));

  protected readonly off = computed(() => (this.disabled() ? 'true' : null));

  protected activate(event: Event): void {
    if (this.disabled()) { event.preventDefault(); return; }
    this.nav.activate(this.id());
  }
}
