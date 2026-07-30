import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Button } from '../button/Button';
import { IconButton } from './IconButton';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, IconButton],
  template: `
    <p class="sub">Ghost is the default; solid is the one filled variant</p>
    <div class="row">
      <arena-icon-button icon="ph-bold ph-pencil-simple" label="Rename" (click)="bump()" />
      <arena-icon-button icon="ph-bold ph-trash" label="Delete project" (click)="bump()" />
      <arena-icon-button icon="ph-bold ph-plus" label="New project" variant="solid" (click)="bump()" />
    </div>

    <p class="sub">Every size stays square, and matches arena-button at the same size</p>
    <div class="row">
      <arena-icon-button icon="ph-bold ph-gear" label="Settings" size="sm" />
      <arena-button size="sm">Small</arena-button>
      <arena-icon-button icon="ph-bold ph-gear" label="Settings" size="md" />
      <arena-button size="md">Medium</arena-button>
      <arena-icon-button icon="ph-bold ph-gear" label="Settings" size="lg" />
      <arena-button size="lg">Large</arena-button>
    </div>

    <p class="sub">showLabel opens the box out and drops the title</p>
    <div class="row">
      <arena-icon-button icon="ph-bold ph-download-simple" label="Export CSV" showLabel />
      <arena-icon-button icon="ph-bold ph-download-simple" label="Export CSV" showLabel variant="solid" />
      <arena-icon-button icon="ph-bold ph-download-simple" label="Hover me for the title" />
    </div>

    <p class="sub">Disabled dims to 45% through a :disabled variant, so the native attribute is really set</p>
    <div class="row">
      <arena-icon-button icon="ph-bold ph-arrow-clockwise" label="Retry" disabled />
      <arena-icon-button icon="ph-bold ph-arrow-clockwise" label="Retry" variant="solid" disabled />
      <arena-icon-button icon="ph-bold ph-arrow-clockwise" label="Retry" showLabel disabled />
    </div>

    <p class="sub">A toolbar — the density that makes an icon-only control worth having</p>
    <div class="bar">
      <arena-icon-button icon="ph-bold ph-arrow-counter-clockwise" label="Undo" size="sm" (click)="bump()" />
      <arena-icon-button icon="ph-bold ph-arrow-clockwise" label="Redo" size="sm" (click)="bump()" />
      <arena-icon-button icon="ph-bold ph-copy" label="Duplicate" size="sm" (click)="bump()" />
      <arena-icon-button icon="ph-bold ph-trash" label="Delete" size="sm" (click)="bump()" />
    </div>

    <p class="sub">click fired {{ clicks() }} time(s) — one per press, never two</p>
  `,
})
class IconButtonCard {
  protected readonly clicks = signal(0);

  protected bump(): void {
    this.clicks.update((n) => n + 1);
  }
}

bootstrapApplication(IconButtonCard, { providers: [provideZonelessChangeDetection()] });
