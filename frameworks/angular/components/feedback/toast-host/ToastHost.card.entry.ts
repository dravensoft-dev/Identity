import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { ToastPlacement, ToastTone } from '../../../Api.generated';
import { dismissActionable, dismissDefault } from '../../../Tokens.generated';
import { Button } from '../../forms/button/Button';
import { Dialog } from '../dialog/Dialog';
import { Toast } from '../toast/Toast';
import { ToastHost } from './ToastHost';

interface Notice {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
}

const PLACEMENTS: ToastPlacement[] = ['top-start', 'top-end', 'bottom-start', 'bottom-end'];

let nextId = 0;

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Dialog, Toast, ToastHost],
  template: `
    <p class="sub">The corner is the whole API — one host, four placements</p>
    <div class="row">
      @for (corner of placements; track corner) {
        <arena-button [variant]="corner === placement() ? 'primary' : 'ghost'"
                      (click)="placement.set(corner)">{{ corner }}</arena-button>
      }
    </div>

    <p class="sub">Raise notices and watch them stack, in the order they were raised</p>
    <div class="row">
      <arena-button (click)="raise('success', 'Snapshot taken')">Raise an advisory</arena-button>
      <arena-button variant="secondary" (click)="raise('gold', 'Quota at 80%', 'Increase')">Raise one with an action</arena-button>
      <arena-button variant="ghost" (click)="raise('danger', 'Region unreachable', 'Retry')">Raise a danger</arena-button>
      <arena-button variant="ghost" (click)="dialog.set(true)">Open a dialog under the stack</arena-button>
    </div>
    <p class="echo">advisory {{ advisoryMs }}ms · with an action {{ actionableMs }}ms · danger never</p>

    <p class="sub">The page scrolls and the stack does not — a fixed box is measured against the viewport</p>
    <div class="tall"></div>

    <arena-dialog [open]="dialog()" title="A stack outranks this panel" eyebrow="Layering"
                  (close)="dialog.set(false)">
      Raise a notice with the dialog open: it paints above the scrim, because --z-toast is the one
      slot above every other overlay.
    </arena-dialog>

    <arena-toast-host [placement]="placement()">
      @for (notice of notices(); track notice.id) {
        <arena-toast [title]="notice.title" [message]="notice.message" [tone]="notice.tone"
                     [actionLabel]="notice.actionLabel" dismissible
                     (action)="drop(notice)" (close)="drop(notice)" />
      }
    </arena-toast-host>
  `,
})
class ToastHostCard {
  protected readonly placements = PLACEMENTS;
  protected readonly placement = signal<ToastPlacement>('bottom-end');
  protected readonly advisoryMs = dismissDefault;
  protected readonly actionableMs = dismissActionable;
  protected readonly notices = signal<Notice[]>([]);
  protected readonly dialog = signal(false);

  protected raise(tone: ToastTone, title: string, actionLabel?: string): void {
    const notice: Notice = { id: nextId++, title, message: 'Raised from the demo page.', tone, actionLabel };
    this.notices.update((all) => [...all, notice]);
    if (tone === 'danger') return;
    const wait = actionLabel ? dismissActionable : dismissDefault;
    setTimeout(() => this.drop(notice), wait);
  }

  protected drop(notice: Notice): void {
    this.notices.update((all) => all.filter((one) => one.id !== notice.id));
  }
}

bootstrapApplication(ToastHostCard, { providers: [provideZonelessChangeDetection()] });
