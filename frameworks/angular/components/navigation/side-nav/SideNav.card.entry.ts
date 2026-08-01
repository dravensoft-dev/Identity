import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Button } from '../../forms/button/Button';
import { SideNavItem } from '../side-nav-item/SideNavItem';
import { SideNavSection } from '../side-nav-section/SideNavSection';
import { SideNavCollapsible } from '../side-nav-collapsible/SideNavCollapsible';
import { SideNav } from './SideNav';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, SideNav, SideNavItem, SideNavSection, SideNavCollapsible],
  template: `
    <p class="sub">Each level steps in by one --sp-1 * indentStep, and the left rail proves it against the right</p>
    <div class="rails">
      <div class="rail">
        <arena-side-nav ariaLabel="Primary" [active]="active()" (nav)="active.set($event)">
          <arena-side-nav-item id="projects" icon="ph-bold ph-squares-four" label="Projects" href="#projects" />
          <arena-side-nav-section label="Workspace">
            <arena-side-nav-item id="members" icon="ph-bold ph-users-three" label="Members" href="#members" [badge]="12" />
            <arena-side-nav-collapsible id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments"
                                        (toggle)="note('deploys', $event)">
              <arena-side-nav-item id="prod" label="Production" href="#prod" />
              <arena-side-nav-item id="staging" label="Staging" href="#staging" />
              <arena-side-nav-collapsible id="regions" label="Regions" (toggle)="note('regions', $event)">
                <arena-side-nav-item id="eu" label="Europe" href="#eu" />
                <arena-side-nav-item id="us" label="United States" href="#us" />
              </arena-side-nav-collapsible>
            </arena-side-nav-collapsible>
            <arena-side-nav-item id="settings" icon="ph-bold ph-gear-six" label="Settings" [badge]="248" />
          </arena-side-nav-section>
        </arena-side-nav>
      </div>

      <div class="rail">
        <arena-side-nav ariaLabel="Wide step" [active]="active()" [indentStep]="6" (nav)="active.set($event)">
          <arena-side-nav-item id="projects" label="Projects" href="#projects" />
          <arena-side-nav-section label="Workspace">
            <arena-side-nav-item id="members" label="Members" href="#members" />
            <arena-side-nav-collapsible id="deploys" label="Deployments">
              <arena-side-nav-item id="prod" label="Production" href="#prod" />
            </arena-side-nav-collapsible>
          </arena-side-nav-section>
        </arena-side-nav>
      </div>
    </div>

    <p class="sub" style="margin-top: var(--sp-6)">Jump into a collapsed subtree: the group opens itself, and reports no toggle</p>
    <div class="rails">
      <arena-button (click)="active.set('us')">Go to United States</arena-button>
      <arena-button variant="secondary" (click)="active.set('projects')">Go to Projects</arena-button>
    </div>
    <p class="echo">active: {{ active() }} · presses reported: {{ presses().join(', ') || '(none)' }}</p>
  `,
})
class SideNavCard {
  protected readonly active = signal('projects');
  protected readonly presses = signal<string[]>([]);

  protected note(id: string, open: boolean): void {
    this.presses.update((all) => [...all, `${id}=${open}`]);
  }
}

bootstrapApplication(SideNavCard, { providers: [provideZonelessChangeDetection()] });
