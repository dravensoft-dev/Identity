import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../theme/theme-service';
import { themeToggleStyles } from './theme-toggle.variants';

const STATE_ICONS = { dark: 'ph-bold ph-sun', light: 'ph-bold ph-moon' } as const;

/** Arena's dark/light switch. Owns no theme state of its own — `ThemeService`'s
 *  `theme` signal is the truth, read directly rather than observed, unlike
 *  React's `ThemeToggle`, which reads the `arena-light` class back off
 *  `<html>` through a `MutationObserver`. `aria-pressed` and the icon both
 *  report the state the toggle is currently IN, never the state a click
 *  would move it to. Its styled root is a real `<button>`, not the host —
 *  the one primitive in the layer that does not host-bind `root`, because a
 *  custom element cannot itself be the native interactive control keyboard
 *  operability requires. */
@Component({
  selector: 'arena-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [class]="styles().root()" [attr.aria-label]="label()"
            [attr.aria-pressed]="dark()" [title]="label()" (click)="toggle()">
      <i [class]="styles().icon() + ' ' + stateIcon()" aria-hidden="true"></i>
    </button>
  `,
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  protected readonly styles = computed(() => themeToggleStyles());
  protected readonly dark = computed(() => this.themeService.theme() === 'dark');
  protected readonly stateIcon = computed(() => (this.dark() ? STATE_ICONS.dark : STATE_ICONS.light));
  protected readonly label = computed(() => (this.dark() ? 'Switch to light theme' : 'Switch to dark theme'));

  protected toggle(): void {
    this.themeService.toggle();
  }
}
