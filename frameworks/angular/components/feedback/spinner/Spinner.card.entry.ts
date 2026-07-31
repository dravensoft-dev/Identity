import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { ControlSize, SpinnerTone } from '../../../Api.generated';
import { Spinner } from './Spinner';

const SIZES: ControlSize[] = ['sm', 'md', 'lg'];
const TONES: SpinnerTone[] = ['accent', 'gold', 'neutral', 'on-accent'];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner],
  template: `
    <p class="sub">The ring rotates on --loop-spin, and SLOWS to --loop-reduced under reduced motion</p>
    <div class="row">
      @for (size of sizes; track size) {
        <arena-spinner [size]="size" [label]="'Loading, ' + size" />
      }
    </div>

    <p class="sub">At sm the gap in the ring must still read as a ring rather than a dot</p>
    <div class="row">
      <arena-spinner size="sm" label="Saving" />
      <arena-spinner size="sm" tone="gold" label="Saving" />
      <arena-spinner size="sm" tone="neutral" label="Saving" />
    </div>

    <p class="sub">on-accent is the only tone that stays legible on a filled brand surface</p>
    <div class="onbrand">
      @for (tone of tones; track tone) {
        <arena-spinner [tone]="tone" [label]="tone" />
      }
    </div>
  `,
})
class SpinnerCard {
  protected readonly sizes = SIZES;
  protected readonly tones = TONES;
}

bootstrapApplication(SpinnerCard, { providers: [provideZonelessChangeDetection()] });
