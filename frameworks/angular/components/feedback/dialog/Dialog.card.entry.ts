import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ArenaFooter } from '../../../ProjectionMarkers';
import { Button } from '../../forms/button/Button';
import { Tooltip } from '../tooltip/Tooltip';
import { ConfirmDialog } from '../confirm-dialog/ConfirmDialog';
import { Dialog } from './Dialog';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaFooter, Button, ConfirmDialog, Dialog, Tooltip],
  template: `
    <p class="sub">The trap's interior: Tab from Cancel must reach Promote, and wrap at both edges</p>
    <div class="row">
      <arena-button (click)="routine.set(true)">Promote build</arena-button>
    </div>

    <p class="sub">A wide dialog, capped at 92vw — narrow the window and the panel follows</p>
    <div class="row">
      <arena-button variant="secondary" (click)="wide.set(true)">Open the wide one</arena-button>
    </div>

    <p class="sub">Layering: a tooltip inside the dialog, and a nested confirmation above it</p>
    <div class="row">
      <arena-button variant="ghost" (click)="layered.set(true)">Open the layered one</arena-button>
    </div>

    <arena-dialog [open]="routine()" eyebrow="Deployment" title="Promote build 482 to production?"
                  (close)="routine.set(false)">
      The current production build stays available for rollback for seven days.
      <div footer>
        <arena-button variant="ghost" (click)="routine.set(false)">Cancel</arena-button>
        <arena-button (click)="routine.set(false)">Promote</arena-button>
      </div>
    </arena-dialog>

    <arena-dialog [open]="wide()" title="Release notes for build 482"
                  width="calc(var(--sp-1) * 200)" (close)="wide.set(false)">
      A wide panel takes its width from the member and still stops at 92vw, so it never
      overruns a narrow viewport. This one carries no footer at all, and the action row is
      absent rather than empty.
    </arena-dialog>

    <arena-dialog [open]="layered()" eyebrow="Danger" title="Retire the staging cluster"
                  (close)="layered.set(false)">
      Every control below sits inside the dialog. The tooltip must paint above the panel, and
      the confirmation above both.
      <div footer>
        <arena-tooltip label="Leaves the cluster running and closes this dialog">
          <arena-button variant="ghost" (click)="layered.set(false)">Cancel</arena-button>
        </arena-tooltip>
        <arena-button (click)="confirming.set(true)">Retire it</arena-button>
      </div>
    </arena-dialog>

    <arena-confirm-dialog [open]="confirming()" destructive title="Retire the staging cluster"
                          confirmLabel="Retire" requireText="staging"
                          (cancel)="confirming.set(false)" (confirm)="close()">
      This removes every node and cannot be undone.
    </arena-confirm-dialog>
  `,
})
class DialogCard {
  protected readonly routine = signal(false);
  protected readonly wide = signal(false);
  protected readonly layered = signal(false);
  protected readonly confirming = signal(false);

  protected close(): void {
    this.confirming.set(false);
    this.layered.set(false);
  }
}

bootstrapApplication(DialogCard, { providers: [provideZonelessChangeDetection()] });
