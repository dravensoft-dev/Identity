import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Radio } from '../radio/Radio';
import { RadioGroup } from './RadioGroup';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioGroup, Radio],
  template: `
    <p class="sub">Tab in once, then arrow — the browser roves, Arena authors no tabindex</p>
    <div class="grid">
      <arena-radio-group ariaLabel="Deployment target" name="env" [value]="target()"
                         (change)="target.set($event)">
        <arena-radio value="production" label="Production" hint="Serves real traffic" />
        <arena-radio value="staging" label="Staging" hint="Mirrors production, no traffic" />
        <arena-radio value="qa" label="QA" hint="Rebuilt on every merge" />
      </arena-radio-group>

      <arena-radio-group ariaLabel="Rollout ring" name="ring" [value]="ring()"
                         (change)="ring.set($event)">
        <arena-radio value="canary" label="Canary" />
        <arena-radio value="early" label="Early" />
        <arena-radio value="broad" label="Broad" />
        <arena-radio value="locked" label="Locked" [disabled]="true" />
      </arena-radio-group>
    </div>

    <p class="sub">Two groups, generated names — they must rove separately, not as one</p>
    <div class="grid">
      <arena-radio-group ariaLabel="Left group" [value]="left()" (change)="left.set($event)">
        <arena-radio value="a" label="Left A" />
        <arena-radio value="b" label="Left B" />
      </arena-radio-group>
      <arena-radio-group ariaLabel="Right group" [value]="right()" (change)="right.set($event)">
        <arena-radio value="a" label="Right A" />
        <arena-radio value="b" label="Right B" />
      </arena-radio-group>
    </div>

    <p class="sub">Uncontrolled — no value bound, so the group remembers its own choice</p>
    <div class="grid">
      <arena-radio-group ariaLabel="Retention window">
        <arena-radio value="7" label="7 days" />
        <arena-radio value="30" label="30 days" />
        <arena-radio value="90" label="90 days" />
      </arena-radio-group>
    </div>

    <p class="sub">
      target={{ target() }} · ring={{ ring() }} · left={{ left() }} · right={{ right() }}
    </p>
  `,
})
class RadioGroupCard {
  protected readonly target = signal('staging');
  protected readonly ring = signal('canary');
  protected readonly left = signal('a');
  protected readonly right = signal('b');
}

bootstrapApplication(RadioGroupCard, { providers: [provideZonelessChangeDetection()] });
