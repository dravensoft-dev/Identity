import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, type WritableSignal, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Textarea } from './Textarea';

const SEEDED = [
  'Batch 1 landed the CDK foundation and the first two primitives.',
  'Batch 2 adds the five form controls that need no CDK, and the demo harness',
  'that makes their by-hand checklists runnable at all.',
].join('\n');

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Textarea],
  template: `
    <p class="sub">Label, hint and rows</p>
    <div class="grid">
      <arena-textarea label="Release notes" hint="Markdown is supported" [rows]="6"
                      [value]="notes()" (change)="set(notes, $event)" />
      <arena-textarea label="Reason" required placeholder="Why is this change needed?"
                      [value]="reason()" (change)="set(reason, $event)" />
    </div>

    <p class="sub">Counter — needs both counter and maxLength; amber past nine tenths</p>
    <div class="grid">
      <arena-textarea label="Summary (well under the cap)" counter [maxLength]="280"
                      [value]="summary()" (change)="set(summary, $event)" />
      <arena-textarea label="Summary (past nine tenths)" counter [maxLength]="100"
                      [value]="nearLimit()" (change)="set(nearLimit, $event)" />
    </div>

    <p class="sub">autoResize — type into the first, and note the second is already tall on load</p>
    <div class="grid">
      <arena-textarea label="Commit message" autoResize [rows]="2"
                      [value]="message()" (change)="set(message, $event)" />
      <arena-textarea label="Seeded long value" autoResize [rows]="2"
                      [value]="seeded()" (change)="set(seeded, $event)" />
    </div>

    <p class="sub">Error replaces the hint; disabled and read-only are different states</p>
    <div class="grid">
      <arena-textarea label="Changelog" error="This entry is longer than the release allows"
                      hint="This hint is replaced, not stacked" [value]="tooLong()" />
      <arena-textarea label="Generated changelog" readOnly [value]="tooLong()" />
      <arena-textarea label="Managed by policy" disabled [value]="tooLong()" />
    </div>
  `,
})
class TextareaCard {
  protected readonly notes = signal('');
  protected readonly reason = signal('');
  protected readonly summary = signal('A short summary.');
  protected readonly nearLimit = signal('a'.repeat(95));
  protected readonly message = signal('');
  protected readonly seeded = signal(SEEDED);
  protected readonly tooLong = signal('Cut the release notes down before publishing.');

  protected set(target: WritableSignal<string>, value: string): void {
    target.set(value);
  }
}

bootstrapApplication(TextareaCard, { providers: [provideZonelessChangeDetection()] });
