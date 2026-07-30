import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Button } from './Button';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <p class="sub">Variants — danger stays outline</p>
    <div class="row">
      <arena-button (click)="bump()">Save changes</arena-button>
      <arena-button variant="secondary" (click)="bump()">Cancel</arena-button>
      <arena-button variant="ghost" (click)="bump()">Dismiss</arena-button>
      <arena-button variant="danger" icon="ph-bold ph-trash" (click)="bump()">Delete project</arena-button>
    </div>

    <p class="sub">Sizes</p>
    <div class="row">
      <arena-button size="sm">Small</arena-button>
      <arena-button size="md">Medium</arena-button>
      <arena-button size="lg">Large</arena-button>
    </div>

    <p class="sub">Icons are class-name strings, never slots</p>
    <div class="row">
      <arena-button icon="ph-bold ph-plus">New project</arena-button>
      <arena-button variant="ghost" iconRight="ph-bold ph-caret-down">More</arena-button>
    </div>

    <p class="sub">Loading slows under prefers-reduced-motion; it never stops</p>
    <div class="row">
      <arena-button loading>Deploying</arena-button>
      <arena-button variant="secondary" loading>Deploying</arena-button>
      <arena-button disabled>Unavailable</arena-button>
      <arena-button variant="danger" disabled>Delete project</arena-button>
    </div>

    <p class="sub">Full width</p>
    <div class="row">
      <arena-button full>Create project</arena-button>
    </div>

    <p class="sub">click fired {{ clicks() }} time(s) — one per press, never two</p>
  `,
})
class ButtonCard {
  protected readonly clicks = signal(0);

  protected bump(): void {
    this.clicks.update((n) => n + 1);
  }
}

bootstrapApplication(ButtonCard, { providers: [provideZonelessChangeDetection()] });
