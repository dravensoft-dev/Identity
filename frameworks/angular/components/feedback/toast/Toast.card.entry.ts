import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { ToastTone } from '../../../Api.generated';
import { dismissActionable, dismissDefault } from '../../../Tokens.generated';
import { Button } from '../../forms/button/Button';
import { Dialog } from '../dialog/Dialog';
import { Toast } from './Toast';

interface Notice {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
}

let nextId = 0;

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Dialog, Toast],
  template: `
    <p class="sub">Every tone: the left bar carries it, the surface never does</p>
    <div class="row">
      <arena-toast title="Build 482 promoted" message="Production is on the new build." tone="success"
                   actionLabel="View logs" dismissible />
      <arena-toast title="Deployment failed" message="Build 482 could not be promoted." tone="danger"
                   actionLabel="Retry" dismissible />
    </div>
    <div class="row">
      <arena-toast title="Cache warmed" message="First requests will be slower for a minute." tone="neutral" dismissible />
      <arena-toast title="Certificate expires in 6 days" message="Renew it before Friday." tone="gold"
                   actionLabel="Renew" dismissible />
    </div>

    <p class="sub">Danger is pinned even when the host passes persist="false"</p>
    <div class="row">
      <arena-toast title="Disk almost full" message="94% of the volume is in use." tone="danger" [persist]="false" />
      <arena-toast title="Nightly backup done" message="Retained for 30 days." tone="success" [persist]="false" />
    </div>

    <p class="sub">The host owns the clock — raise one and watch it expire, except the pinned ones</p>
    <div class="row">
      <arena-button (click)="raise('success', 'Snapshot taken')">Raise an advisory</arena-button>
      <arena-button variant="secondary" (click)="raise('gold', 'Quota at 80%', 'Increase')">Raise one with an action</arena-button>
      <arena-button variant="ghost" (click)="raise('danger', 'Region unreachable', 'Retry')">Raise a danger</arena-button>
      <arena-button variant="ghost" (click)="dialog.set(true)">Open a dialog under the stack</arena-button>
    </div>
    <p class="echo">advisory {{ advisoryMs }}ms · with an action {{ actionableMs }}ms · danger never</p>

    <arena-dialog [open]="dialog()" title="A toast outranks this panel" eyebrow="Layering"
                  (close)="dialog.set(false)">
      Raise a toast with the dialog open: it paints above the scrim, because --z-toast is the one
      slot above every other overlay.
    </arena-dialog>

    <div class="stack">
      @for (notice of notices(); track notice.id) {
        <arena-toast [title]="notice.title" [message]="notice.message" [tone]="notice.tone"
                     [actionLabel]="notice.actionLabel" dismissible
                     (action)="drop(notice)" (close)="drop(notice)" />
      }
    </div>
  `,
})
class ToastCard {
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

bootstrapApplication(ToastCard, { providers: [provideZonelessChangeDetection()] });
