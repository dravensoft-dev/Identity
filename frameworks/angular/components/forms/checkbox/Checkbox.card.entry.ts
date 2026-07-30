import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, type WritableSignal, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Checkbox } from './Checkbox';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Checkbox],
  template: `
    <p class="sub">Controlled — the consumer owns the value and pushes it back</p>
    <div class="stack">
      <arena-checkbox label="Notify on failure" [checked]="failure()" (change)="apply(failure, $event)" />
      <arena-checkbox label="Notify on success" [checked]="success()" (change)="apply(success, $event)" />
      <arena-checkbox label="Notify on every deploy" [checked]="every()" (change)="apply(every, $event)" />
    </div>

    <p class="sub">Resting states</p>
    <div class="row">
      <arena-checkbox label="Unchecked" />
      <arena-checkbox label="Checked" checked />
    </div>

    <p class="sub">Disabled dims the whole control, label included</p>
    <div class="row">
      <arena-checkbox label="Managed by policy" disabled />
      <arena-checkbox label="Managed by policy" checked disabled />
    </div>

    <p class="sub">Required — the native attribute, not aria-required</p>
    <div class="row">
      <arena-checkbox label="I accept the terms" required name="terms" value="yes"
                      [checked]="accepted()" (change)="apply(accepted, $event)" />
    </div>

    <p class="sub">No label — an accessible name is what is missing, and this is what that looks like</p>
    <div class="row">
      <arena-checkbox [checked]="bare()" (change)="apply(bare, $event)" />
    </div>

    <p class="sub">
      failure={{ failure() }} success={{ success() }} every={{ every() }}
      accepted={{ accepted() }} — {{ changes() }} change(s), one per toggle
    </p>
  `,
})
class CheckboxCard {
  protected readonly failure = signal(true);
  protected readonly success = signal(false);
  protected readonly every = signal(false);
  protected readonly accepted = signal(false);
  protected readonly bare = signal(false);
  protected readonly changes = signal(0);

  protected apply(target: WritableSignal<boolean>, value: boolean): void {
    target.set(value);
    this.changes.update((n) => n + 1);
  }
}

bootstrapApplication(CheckboxCard, { providers: [provideZonelessChangeDetection()] });
