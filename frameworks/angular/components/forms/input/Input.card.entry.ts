import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, type WritableSignal, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Input } from './Input';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Input],
  template: `
    <p class="sub">Label, hint, required marker and affixes</p>
    <div class="grid">
      <arena-input label="Project name" hint="Lowercase, no spaces" required
                   [value]="name()" (change)="set(name, $event)" />
      <arena-input label="Repository" icon="ph-bold ph-git-branch" prefix="git@"
                   [value]="repo()" (change)="set(repo, $event)" />
    </div>

    <p class="sub">Validation — blur by default, per keystroke under validateOn="change"</p>
    <div class="grid">
      <arena-input label="Slug (validates on blur)" [validate]="minThree"
                   [value]="slug()" (change)="set(slug, $event)" />
      <arena-input label="Contact email (validates as you type)" type="email"
                   validateOn="change" [validate]="looksLikeEmail"
                   [value]="email()" (change)="set(email, $event)" />
    </div>

    <p class="sub">Resting states — a controlled error, and a forced valid</p>
    <div class="grid">
      <arena-input label="Taken" error="That name is already in use" value="arena"
                   hint="This hint is replaced by the error, not stacked under it" />
      <arena-input label="Available" valid value="arena-two" />
    </div>

    <p class="sub">Disabled and read-only are different states, and they look different</p>
    <div class="grid">
      <arena-input label="Managed by policy" disabled value="production" />
      <arena-input label="Created" readOnly value="2026-07-30" />
    </div>

    <p class="sub">type="date" — the picker indicator must be visible on the dark field</p>
    <div class="grid">
      <arena-input label="Starts" type="date" [value]="starts()" (change)="set(starts, $event)" />
      <arena-input label="At" type="time" [value]="at()" (change)="set(at, $event)" />
    </div>

    <p class="sub">Controlled — the box holds what the signal holds: "{{ name() }}"</p>
  `,
})
class InputCard {
  protected readonly name = signal('arena');
  protected readonly repo = signal('dravensoft/arena.git');
  protected readonly slug = signal('');
  protected readonly email = signal('');
  protected readonly starts = signal('2026-07-30');
  protected readonly at = signal('09:30');

  protected readonly minThree = (value: string): string => (value.length < 3 ? 'At least three characters' : '');
  protected readonly looksLikeEmail = (value: string): string => (value.includes('@') ? '' : 'Needs an @');

  protected set(target: WritableSignal<string>, value: string): void {
    target.set(value);
  }
}

bootstrapApplication(InputCard, { providers: [provideZonelessChangeDetection()] });
