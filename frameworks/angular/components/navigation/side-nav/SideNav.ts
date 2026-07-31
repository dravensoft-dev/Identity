import {
  ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute, output, signal,
} from '@angular/core';
import { SideNavState } from './SideNavState';
import { sideNavStyles } from './SideNav.variants';

@Component({
  selector: 'arena-side-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SideNavState],
  host: {
    '[class]': 'styles().root()',
    role: 'navigation',
    '[attr.aria-label]': 'label()',
  },
  template: `<ng-content />`,
})
export class SideNav {
  readonly active = input<string>();
  readonly ariaLabel = input.required<string>();
  readonly indentStep = input(3, { transform: numberAttribute });
  readonly nav = output<string>();

  private readonly state = inject(SideNavState);

  protected readonly label = computed(() => {
    const name = this.ariaLabel();
    if (name.trim() === '') {
      throw new Error('SideNav: `ariaLabel` is required, and names which navigation this landmark is');
    }
    return name;
  });

  protected readonly styles = computed(() => sideNavStyles());

  constructor() {
    this.state.depth = signal(0);
    this.state.activeId = this.active;
    this.state.indentStep = this.indentStep;
    this.state.activate = (id: string) => this.nav.emit(id);
  }
}
