import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { TabsState } from '../arena-tabs/TabsState';
import { arenaTabStyles } from './ArenaTab.variants';

@Component({
  selector: 'arena-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().panel()',
    role: 'tabpanel',
    '[attr.id]': 'panelId()',
    '[attr.aria-labelledby]': 'tabId()',
    '[attr.tabindex]': 'selected() ? 0 : -1',
  },
  template: `<ng-content />`,
})
export class ArenaTab {
  /** What this tab selects, and what the parent's `change` carries. */
  readonly value = input.required<string>();
  /** What the tab reads. Arena draws the button; the consumer names it. */
  readonly label = input.required<string>();

  private readonly tabs = inject(TabsState);

  protected readonly selected = computed(() => this.tabs.selected() === this.value());
  protected readonly panelId = computed(() => this.tabs.panelId(this.value()));
  protected readonly tabId = computed(() => this.tabs.tabId(this.value()));
  protected readonly styles = computed(() => arenaTabStyles({ selected: this.selected() }));
}
