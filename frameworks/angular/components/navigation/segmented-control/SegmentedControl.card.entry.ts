import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { SegmentOption } from '../../../Api.generated';
import { SegmentedControl } from './SegmentedControl';

const RANGES: SegmentOption[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const STATUSES: SegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'passing', label: 'Passing' },
  { value: 'failing', label: 'Failing' },
];

const PAIR: SegmentOption[] = [
  { value: 'mine', label: 'Mine' },
  { value: 'team', label: 'Team' },
];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegmentedControl],
  template: `
    <p class="sub">Tab in once — the ring is on the track, because the input is invisible</p>
    <div class="row">
      <arena-segmented-control ariaLabel="Time range" [options]="ranges" [value]="range()"
                               (change)="range.set($event)" />
      <arena-segmented-control ariaLabel="Build status" [options]="statuses" [value]="status()"
                               (change)="status.set($event)" />
    </div>

    <p class="sub">Both sizes — sm is where the selected lift has to still read</p>
    <div class="row">
      <arena-segmented-control ariaLabel="Time range, small" size="sm" [options]="ranges"
                               [value]="range()" (change)="range.set($event)" />
      <arena-segmented-control ariaLabel="Time range, default" size="md" [options]="ranges"
                               [value]="range()" (change)="range.set($event)" />
    </div>

    <p class="sub">Two options is the floor; generated names keep these two independent</p>
    <div class="row">
      <arena-segmented-control ariaLabel="Scope, left" [options]="pair" [value]="left()"
                               (change)="left.set($event)" />
      <arena-segmented-control ariaLabel="Scope, right" [options]="pair" [value]="right()"
                               (change)="right.set($event)" />
    </div>

    <p class="sub">Uncontrolled with a defaultValue, and uncontrolled with none (first wins)</p>
    <div class="row">
      <arena-segmented-control ariaLabel="Status, defaulted" [options]="statuses" defaultValue="failing" />
      <arena-segmented-control ariaLabel="Status, bare" [options]="statuses" />
    </div>

    <p class="sub">
      range={{ range() }} · status={{ status() }} · left={{ left() }} · right={{ right() }}
    </p>
  `,
})
class SegmentedControlCard {
  protected readonly ranges = RANGES;
  protected readonly statuses = STATUSES;
  protected readonly pair = PAIR;
  protected readonly range = signal('7d');
  protected readonly status = signal('all');
  protected readonly left = signal('mine');
  protected readonly right = signal('team');
}

bootstrapApplication(SegmentedControlCard, { providers: [provideZonelessChangeDetection()] });
