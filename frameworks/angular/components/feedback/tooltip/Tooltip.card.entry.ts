import '@angular/compiler';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Button } from '../../forms/button/Button';
import { Tooltip } from './Tooltip';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Tooltip],
  template: `
    <p class="sub">At the top of the viewport the bubble must flip below its trigger</p>
    <div class="row">
      <arena-tooltip label="Deploys the current branch to production">
        <arena-button>Deploy</arena-button>
      </arena-tooltip>
      <arena-tooltip label="Rolls the last deploy back">
        <arena-button variant="secondary">Roll back</arena-button>
      </arena-tooltip>
    </div>

    <p class="sub">Pointer waits --delay-open; keyboard focus reveals immediately</p>
    <div class="row">
      <arena-tooltip label="Tab to this control and the bubble appears with no delay">
        <arena-button variant="ghost">Focus me with Tab</arena-button>
      </arena-tooltip>
      <arena-tooltip label="Crossing this control on the way somewhere else must not flash">
        <arena-button variant="ghost">Cross me quickly</arena-button>
      </arena-tooltip>
    </div>

    <p class="sub">Inside overflow: hidden — the bubble escapes, where React's is clipped</p>
    <div class="clip">
      <arena-tooltip label="This bubble is rendered into an overlay pane on document.body">
        <arena-button variant="secondary">Clipped ancestor</arena-button>
      </arena-tooltip>
    </div>

    <p class="sub">Inside a scroll container — the bubble repositions as you scroll</p>
    <div class="scroller">
      <div class="row">
        <arena-tooltip label="Scroll the container with the bubble open">
          <arena-button variant="secondary">Scroll me</arena-button>
        </arena-tooltip>
      </div>
      <div class="tall"></div>
    </div>
  `,
})
class TooltipCard {}

bootstrapApplication(TooltipCard, { providers: [provideZonelessChangeDetection()] });
