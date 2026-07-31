import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type { MenuItem } from '../../../Api.generated';
import { ArenaFooter } from '../../../ProjectionMarkers';
import { Button } from '../../forms/button/Button';
import { IconButton } from '../../forms/icon-button/IconButton';
import { Dialog } from '../../feedback/dialog/Dialog';
import { Tooltip } from '../../feedback/tooltip/Tooltip';
import { Menu } from './Menu';

const ACTIONS: MenuItem[] = [
  { header: 'Build 482' },
  { label: 'Promote to production', icon: 'ph-bold ph-rocket-launch', shortcut: 'P' },
  { label: 'Download logs', icon: 'ph-bold ph-download-simple' },
  { label: 'Re-run', icon: 'ph-bold ph-arrow-clockwise', disabled: true },
  { divider: true },
  { label: 'Delete build', icon: 'ph-bold ph-trash', destructive: true },
];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaFooter, Button, Dialog, IconButton, Menu, Tooltip],
  template: `
    <p class="sub">One Enter opens it once, and one Space does too — a browser is where a double-open shows</p>
    <div class="row ends">
      <arena-menu [items]="actions" (select)="report($event)">
        <arena-button trigger variant="secondary">More actions</arena-button>
      </arena-menu>
      <arena-menu [items]="actions" align="end" (select)="report($event)">
        <arena-icon-button trigger icon="ph-bold ph-dots-three-vertical" label="More actions" />
      </arena-menu>
    </div>
    <p class="echo">select reported: {{ chosen() }}</p>

    <p class="sub">Inside overflow: hidden — the panel escapes, where an absolute one is clipped</p>
    <div class="clip">
      <arena-menu [items]="actions" (select)="report($event)">
        <arena-button trigger variant="secondary">Clipped ancestor</arena-button>
      </arena-menu>
    </div>

    <p class="sub">Inside a scroll container — the panel repositions as you scroll</p>
    <div class="scroller">
      <div class="row">
        <arena-menu [items]="actions" (select)="report($event)">
          <arena-button trigger variant="secondary">Scroll me</arena-button>
        </arena-menu>
      </div>
      <div class="tall"></div>
    </div>

    <p class="sub">Near the bottom edge the panel flips above its trigger — scroll this one into view</p>
    <div class="tall"></div>
    <div class="row">
      <arena-menu [items]="actions" (select)="report($event)">
        <arena-button trigger variant="ghost">Open me at the foot of the page</arena-button>
      </arena-menu>
      <arena-button variant="ghost" (click)="dialog.set(true)">Open a menu inside a dialog</arena-button>
    </div>

    <arena-dialog [open]="dialog()" title="A menu opens above this panel" eyebrow="Layering"
                  (close)="dialog.set(false)">
      The CDK layer sits above every in-flow overlay, so the panel is not trapped behind the
      scrim. A tooltip on a row lands above the menu, by DOM order inside the same container.
      <div footer>
        <arena-menu [items]="actions" align="end" (select)="report($event)">
          <arena-tooltip trigger label="Every action for this build">
            <arena-button>Build actions</arena-button>
          </arena-tooltip>
        </arena-menu>
      </div>
    </arena-dialog>
  `,
})
class MenuCard {
  protected readonly actions = ACTIONS;
  protected readonly chosen = signal('(nothing yet)');
  protected readonly dialog = signal(false);

  protected report(item: MenuItem): void {
    this.chosen.set(item.label ?? '(no label)');
  }
}

bootstrapApplication(MenuCard, { providers: [provideZonelessChangeDetection()] });
