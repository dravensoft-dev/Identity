import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Tab } from '../tab/Tab';
import { Tabs } from './Tabs';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tabs, Tab],
  template: `
    <p class="sub">Controlled — Left and Right walk the strip, and the selection follows the focus</p>
    <arena-tabs [value]="view()" (change)="view.set($event)">
      <arena-tab value="overview" label="Overview">
        <p class="body">The overview panel. Every panel below mounts at once; the ones that are not
        selected are hidden rather than removed, because each tab points at a panel that must exist.</p>
      </arena-tab>
      <arena-tab value="deployments" label="Deployments">
        <p class="body">The deployments panel. Switching tabs must not shift this text down or up —
        the panel keeps its top gap in both states.</p>
      </arena-tab>
      <arena-tab value="settings" label="Settings">
        <p class="body">The settings panel.</p>
      </arena-tab>
    </arena-tabs>

    <p class="sub">Uncontrolled with a defaultValue — the strip remembers its own choice</p>
    <arena-tabs defaultValue="tokens">
      <arena-tab value="tokens" label="Tokens">
        <p class="body">Started here because defaultValue said so.</p>
      </arena-tab>
      <arena-tab value="recipes" label="Recipes">
        <p class="body">Chosen by hand, and remembered without a handler.</p>
      </arena-tab>
    </arena-tabs>

    <p class="sub">Uncontrolled with nothing — the first tab wins, so a panel is always showing</p>
    <arena-tabs>
      <arena-tab value="north" label="North">
        <p class="body">Two strips on one page must switch independently: that is the generated id
        base working. Walk this one and watch the strip above stay where it was.</p>
      </arena-tab>
      <arena-tab value="south" label="South">
        <p class="body">The south panel.</p>
      </arena-tab>
      <arena-tab value="east" label="East">
        <p class="body">The east panel.</p>
      </arena-tab>
    </arena-tabs>

    <p class="sub">view={{ view() }}</p>
  `,
})
class TabsCard {
  protected readonly view = signal('deployments');
}

bootstrapApplication(TabsCard, { providers: [provideZonelessChangeDetection()] });
