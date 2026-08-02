import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { GridGap } from '../../../Api.generated';
import { Button } from '../../forms/button/Button';
import { Grid } from './Grid';

const GAPS: GridGap[] = ['none', 'sm', 'md', 'lg'];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Grid],
  template: `
    <p class="sub">Four named steps, and no length anywhere</p>
    <div class="row">
      @for (step of gaps; track step) {
        <arena-button [variant]="step === gap() ? 'primary' : 'ghost'"
                      (click)="gap.set(step)">gap="{{ step }}"</arena-button>
      }
    </div>

    <p class="sub">Drag the frame's corner: the count falls with the room, one step at a time</p>
    <div class="frame">
      <arena-grid [gap]="gap()">
        @for (n of cells; track n) {
          <div class="cell">Cell {{ n }}</div>
        }
      </arena-grid>
    </div>

    <p class="sub">A min wider than the frame gives one clamped column, never an overflow</p>
    <div class="frame">
      <arena-grid min="calc(var(--sp-1) * 400)" [gap]="gap()">
        @for (n of [1, 2, 3]; track n) {
          <div class="cell">Wide cell {{ n }}</div>
        }
      </arena-grid>
    </div>

    <p class="sub">maxWidth caps the grid and centres it</p>
    <arena-grid maxWidth="calc(var(--sp-1) * 120)" [gap]="gap()">
      @for (n of [1, 2]; track n) {
        <div class="cell">Capped {{ n }}</div>
      }
    </arena-grid>
    <p class="echo">gap {{ gap() }} · default min is 200px, reached as calc(var(--sp-1) * 50)</p>
  `,
})
class GridCard {
  protected readonly gaps = GAPS;
  protected readonly gap = signal<GridGap>('md');
  protected readonly cells = [1, 2, 3, 4, 5, 6, 7, 8];
}

bootstrapApplication(GridCard, { providers: [provideZonelessChangeDetection()] });
