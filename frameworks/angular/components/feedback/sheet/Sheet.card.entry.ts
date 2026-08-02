import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { SheetPlacement } from '../../../Api.generated';
import { ArenaFooter } from '../../../ProjectionMarkers';
import { Button } from '../../forms/button/Button';
import { Menu } from '../../navigation/menu/Menu';
import { Sheet } from './Sheet';

const PLACEMENTS: SheetPlacement[] = ['bottom', 'start', 'end'];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaFooter, Button, Menu, Sheet],
  template: `
    <p class="sub">The edge is the whole placement API</p>
    <div class="row">
      @for (edge of placements; track edge) {
        <arena-button [variant]="edge === placement() ? 'primary' : 'ghost'"
                      (click)="placement.set(edge)">{{ edge }}</arena-button>
      }
    </div>

    <p class="sub">Closed and folded are two different states, and both are here</p>
    <div class="row">
      <arena-button (click)="open.set(!open())">{{ open() ? 'Close' : 'Open' }} the panel</arena-button>
      <arena-button variant="secondary" (click)="collapsed.set(!collapsed())">
        {{ collapsed() ? 'Unfold' : 'Fold' }} the body
      </arena-button>
    </div>
    <p class="echo">open {{ open() }} · collapsed {{ collapsed() }} · reported {{ reports() }}</p>

    <p class="sub">The page behind stays usable: scroll it, and press this while the panel is open</p>
    <div class="row">
      <arena-button variant="ghost" (click)="pokes.set(pokes() + 1)">Poked {{ pokes() }} times</arena-button>
    </div>
    <div class="tall"></div>

    <arena-sheet [open]="open()" [placement]="placement()" title="Cart"
                 [collapsed]="collapsed()" (collapsedChange)="fold($event)"
                 dismissible (close)="open.set(false)">
      <p>Two line items, and a menu opened from in here paints over the panel.</p>
      <arena-menu ariaLabel="Line actions" label="Line actions" [items]="items" />
      <div footer>
        <arena-button variant="ghost" (click)="open.set(false)">Keep shopping</arena-button>
        <arena-button (click)="pokes.set(pokes() + 1)">Checkout</arena-button>
      </div>
    </arena-sheet>

    <div class="bar">A fixed bar on --z-nav, which the panel paints over</div>
  `,
})
class SheetCard {
  protected readonly placements = PLACEMENTS;
  protected readonly placement = signal<SheetPlacement>('end');
  protected readonly open = signal(true);
  protected readonly collapsed = signal(false);
  protected readonly reports = signal(0);
  protected readonly pokes = signal(0);
  protected readonly items = [
    { id: 'dup', label: 'Duplicate line' },
    { id: 'rm', label: 'Remove line' },
  ];

  protected fold(next: boolean): void {
    this.collapsed.set(next);
    this.reports.update((n) => n + 1);
  }
}

bootstrapApplication(SheetCard, { providers: [provideZonelessChangeDetection()] });
