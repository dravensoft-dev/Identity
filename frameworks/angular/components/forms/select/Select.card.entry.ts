import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { SelectOption } from '../../../Api.generated';
import { Select } from './Select';

const ENVIRONMENTS: SelectOption[] = [
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
  { value: 'canary', label: 'Canary — 5% of traffic' },
];

const REGIONS: SelectOption[] = [
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'sa-east-1', label: 'South America (Sao Paulo)' },
];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Select],
  template: `
    <p class="sub">The popup, the arrow keys and type-ahead are the platform's — Arena draws the field</p>
    <div class="row">
      <div class="col">
        <arena-select label="Environment" [options]="environments" [value]="env()" name="env"
                      (change)="env.set($event)" />
      </div>
      <div class="col">
        <arena-select label="Region" [options]="regions" [value]="region()" name="region"
                      (change)="region.set($event)" />
      </div>
    </div>
    <p class="echo">change reported: {{ env() }} / {{ region() }}</p>

    <p class="sub">The caret swallows no click: pressing it opens the control beneath it</p>
    <div class="row">
      <div class="col">
        <arena-select label="Press the caret" [options]="environments" value="canary" />
      </div>
    </div>

    <p class="sub">Disabled dims the whole column, label included, and refuses the pointer</p>
    <div class="row">
      <div class="col">
        <arena-select label="Locked to production" [options]="environments" value="production" disabled />
      </div>
    </div>

    <p class="sub">No label — the control has no accessible name, which is why one belongs here</p>
    <div class="row">
      <div class="col">
        <arena-select [options]="regions" value="us-east-1" />
      </div>
    </div>
  `,
})
class SelectCard {
  protected readonly environments = ENVIRONMENTS;
  protected readonly regions = REGIONS;
  protected readonly env = signal('staging');
  protected readonly region = signal('eu-west-1');
}

bootstrapApplication(SelectCard, { providers: [provideZonelessChangeDetection()] });
