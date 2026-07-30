import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, type WritableSignal, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Switch } from './Switch';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Switch],
  template: `
    <p class="sub">Directional events — funcOn and funcOff, never one toggle</p>
    <div class="stack">
      <arena-switch label="Auto-deploy on merge" [state]="auto()"
                    (funcOn)="set(auto, true)" (funcOff)="set(auto, false)" />
      <arena-switch label="Notify the on-call rota" [state]="notify()"
                    (funcOn)="set(notify, true)" (funcOff)="set(notify, false)" />
    </div>

    <p class="sub">Per-state glyphs ride inside the knob, and only the current one is in the DOM</p>
    <div class="stack">
      <arena-switch label="Dark theme" iconOn="ph-bold ph-moon" iconOff="ph-bold ph-sun"
                    [state]="dark()" (funcOn)="set(dark, true)" (funcOff)="set(dark, false)" />
    </div>

    <p class="sub">Five sizes — the glyph must stay legible at sm, which is what decides the feature</p>
    <div class="row">
      <arena-switch label="sm" size="sm" iconOn="ph-bold ph-check" iconOff="ph-bold ph-x"
                    [state]="sized()" (funcOn)="set(sized, true)" (funcOff)="set(sized, false)" />
      <arena-switch label="md" size="md" iconOn="ph-bold ph-check" iconOff="ph-bold ph-x"
                    [state]="sized()" (funcOn)="set(sized, true)" (funcOff)="set(sized, false)" />
      <arena-switch label="lg" size="lg" iconOn="ph-bold ph-check" iconOff="ph-bold ph-x"
                    [state]="sized()" (funcOn)="set(sized, true)" (funcOff)="set(sized, false)" />
      <arena-switch label="xl" size="xl" iconOn="ph-bold ph-check" iconOff="ph-bold ph-x"
                    [state]="sized()" (funcOn)="set(sized, true)" (funcOff)="set(sized, false)" />
      <arena-switch label="2xl" size="2xl" iconOn="ph-bold ph-check" iconOff="ph-bold ph-x"
                    [state]="sized()" (funcOn)="set(sized, true)" (funcOff)="set(sized, false)" />
    </div>

    <p class="sub">Vertical transposes the track, and the knob travels down instead of across</p>
    <div class="tall">
      <arena-switch label="sm" orientation="vertical" size="sm" [state]="vertical()"
                    (funcOn)="set(vertical, true)" (funcOff)="set(vertical, false)" />
      <arena-switch label="md" orientation="vertical" size="md" [state]="vertical()"
                    (funcOn)="set(vertical, true)" (funcOff)="set(vertical, false)" />
      <arena-switch label="2xl" orientation="vertical" size="2xl" [state]="vertical()"
                    (funcOn)="set(vertical, true)" (funcOff)="set(vertical, false)" />
    </div>

    <p class="sub">confirm applies nothing — it requests, and the host decides</p>
    <div class="stack">
      <arena-switch label="Allow force pushes" confirm [state]="force()"
                    (requestChange)="requests.set(requests() + 1)" />
      <arena-switch label="Allow force pushes (host confirms, then applies)" confirm [state]="guarded()"
                    (requestChange)="set(guarded, !guarded())" />
    </div>

    <p class="sub">Disabled dims the whole row, and the label stops toggling too</p>
    <div class="stack">
      <arena-switch label="Managed by policy" disabled [state]="false" />
      <arena-switch label="Managed by policy" disabled state />
    </div>

    <p class="sub">
      force stayed {{ force() }} across {{ requests() }} request(s) — that is the guard working
    </p>
  `,
})
class SwitchCard {
  protected readonly auto = signal(true);
  protected readonly notify = signal(false);
  protected readonly dark = signal(true);
  protected readonly sized = signal(true);
  protected readonly vertical = signal(false);
  protected readonly force = signal(false);
  protected readonly guarded = signal(false);
  protected readonly requests = signal(0);

  protected set(target: WritableSignal<boolean>, value: boolean): void {
    target.set(value);
  }
}

bootstrapApplication(SwitchCard, { providers: [provideZonelessChangeDetection()] });
