import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input } from '@angular/core';
import { SideNavChild, SideNavState, indentFor } from '../side-nav/SideNavState';
import { sideNavStyles } from '../side-nav/SideNav.variants';

@Component({
  selector: 'arena-side-nav-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SideNavChild, useExisting: forwardRef(() => SideNavItem) }],
  host: {
    style: 'display: contents',
  },
  template: `
    @if (href(); as url) {
      <a [class]="styles().item()" [href]="url" [style.paddingInlineStart]="indent()"
         [attr.aria-current]="current()" (click)="activate()">
        @if (icon(); as glyph) {
          <i [class]="styles().icon() + ' ' + glyph" aria-hidden="true"></i>
        }
        {{ name() }}
      </a>
    } @else {
      <button type="button" [class]="styles().item()" [style.paddingInlineStart]="indent()"
              [attr.aria-current]="current()" (click)="activate()">
        @if (icon(); as glyph) {
          <i [class]="styles().icon() + ' ' + glyph" aria-hidden="true"></i>
        }
        {{ name() }}
      </button>
    }
  `,
})
export class SideNavItem {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly href = input<string>();

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

  protected activate(): void {
    this.nav.activate(this.id());
  }
}
