import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { ControlSize, ProgressTone } from '../../../Api.generated';
import { Button } from '../../forms/button/Button';
import { ProgressBar } from './ProgressBar';

const TONES: ProgressTone[] = ['accent', 'gold', 'success', 'danger', 'info'];
const SIZES: ControlSize[] = ['sm', 'md', 'lg'];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, ProgressBar],
  template: `
    <p class="sub">The determinate fill animates its width on --dur-mid when the value moves</p>
    <div class="col">
      <arena-progress-bar [progressPercentage]="value()" label="Uploading build 482" />
    </div>
    <div class="row">
      <arena-button (click)="step(-25)">-25</arena-button>
      <arena-button (click)="step(25)">+25</arena-button>
      <arena-button variant="ghost" (click)="value.set(0)">Reset</arena-button>
    </div>

    <p class="sub">The indeterminate sweep travels continuously, and SLOWS rather than stops under reduced motion</p>
    <div class="col">
      <arena-progress-bar indeterminate label="Waiting for the build agent" />
    </div>

    <p class="sub">Every tone inks the fill; the track behind it stays the neutral rail in all five</p>
    <div class="col">
      @for (tone of tones; track tone) {
        <arena-progress-bar [tone]="tone" [progressPercentage]="62" [label]="tone" />
      }
    </div>

    <p class="sub">The three sizes differ in track height alone</p>
    <div class="col">
      @for (size of sizes; track size) {
        <arena-progress-bar [size]="size" [progressPercentage]="62" [label]="size" />
      }
    </div>

    <p class="sub">No label and no percentage means no head row at all</p>
    <div class="col">
      <arena-progress-bar [progressPercentage]="62" [showPercentage]="false" />
    </div>
  `,
})
class ProgressBarCard {
  protected readonly tones = TONES;
  protected readonly sizes = SIZES;
  protected readonly value = signal(35);

  protected step(by: number): void {
    this.value.update((current) => current + by);
  }
}

bootstrapApplication(ProgressBarCard, { providers: [provideZonelessChangeDetection()] });
