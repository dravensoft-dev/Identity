import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Button } from '../../forms/button/Button';
import { Menu } from '../menu/Menu';
import { BottomNav } from './BottomNav';
import { BottomNavItem } from '../bottom-nav-item/BottomNavItem';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Menu, BottomNav, BottomNavItem],
  template: `
    <p class="sub">Narrow the window to 390px — the bar is a phone's, not a wide screen's</p>
    <p class="echo">active {{ route() }} · reported {{ reports().join(', ') || 'nothing yet' }}</p>

    <p class="sub">A menu opened from the page paints over the bar, which is what --z-nav means</p>
    <div class="row">
      <arena-menu ariaLabel="Page actions" label="Page actions" [items]="items" />
      <arena-button variant="ghost" (click)="reports.set([])">Clear the log</arena-button>
    </div>

    <p class="sub">The page reserves the bar's height, so the last row is never underneath it</p>
    <div class="tall"></div>
    <p class="echo">This line is the last of the page, and the bar does not cover it.</p>

    <arena-bottom-nav ariaLabel="Primary" [active]="route()" (nav)="go($event)">
      <arena-bottom-nav-item id="home" icon="ph-bold ph-house" label="Home" href="#home" />
      <arena-bottom-nav-item id="orders" icon="ph-bold ph-receipt" label="Orders" href="#orders" [badge]="12" />
      <arena-bottom-nav-item id="clients" icon="ph-bold ph-users" label="Clients" href="#clients" [badge]="4821" />
      <arena-bottom-nav-item id="reports" icon="ph-bold ph-chart-bar" label="Reports" disabled />
      <arena-bottom-nav-item id="more" icon="ph-bold ph-dots-three" label="More" />
    </arena-bottom-nav>
  `,
})
class BottomNavCard {
  protected readonly route = signal('home');
  protected readonly reports = signal<string[]>([]);
  protected readonly items = [
    { id: 'refresh', label: 'Refresh' },
    { id: 'export', label: 'Export' },
  ];

  protected go(id: string): void {
    this.route.set(id);
    this.reports.update((all) => [...all, id]);
  }
}

bootstrapApplication(BottomNavCard, { providers: [provideZonelessChangeDetection()] });
