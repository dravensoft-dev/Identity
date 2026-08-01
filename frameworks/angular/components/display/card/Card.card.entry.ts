import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ArenaAction } from '../../../ProjectionMarkers';
import { Badge } from '../badge/Badge';
import { Card } from './Card';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAction, Badge, Card],
  template: `
    <p class="sub">A surface: no role, no tab stop, nothing to press</p>
    <div class="row">
      <div class="col">
        <arena-card [eyebrow]="'Delivery'" [title]="'Client Portal'">
          <arena-badge action tone="success" dot>Deployed</arena-badge>
          <p class="note">Last published 2 h ago, build #4821.</p>
        </arena-card>
      </div>
      <div class="col">
        <arena-card accent floating [title]="'Latency alert'">
          <p class="note">p95 rose to 340 ms on checkout.</p>
        </arena-card>
      </div>
    </div>

    <p class="sub">interactive: the whole card is the target, by pointer and by Enter or Space</p>
    <div class="row">
      <div class="col">
        <arena-card interactive [title]="'checkout-api'" (click)="open('checkout-api')">
          <p class="note">Healthy, 14 replicas.</p>
        </arena-card>
      </div>
      <div class="col">
        <arena-card interactive disabled [title]="'billing-api'" (click)="open('billing-api')">
          <p class="note">Locked by your role. Reachable by Tab, and it will not activate.</p>
        </arena-card>
      </div>
    </div>

    <p class="sub">A control inside an interactive card keeps its own press</p>
    <div class="row">
      <div class="col">
        <arena-card interactive [title]="'search-api'" (click)="open('search-api')">
          <arena-badge action tone="warning">Degraded</arena-badge>
          <p class="note">Enter typed in the field must not open the card.</p>
          <input aria-label="Rename service" />
        </arena-card>
      </div>
    </div>

    <p class="sub">opened: {{ opened() || 'nothing yet' }}</p>
  `,
})
class CardCard {
  protected readonly opened = signal('');

  protected open(name: string): void {
    this.opened.set(name);
  }
}

bootstrapApplication(CardCard, { providers: [provideZonelessChangeDetection()] });
