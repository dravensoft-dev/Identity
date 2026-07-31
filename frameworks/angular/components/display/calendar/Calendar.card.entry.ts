import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ArenaActions } from '../../../ProjectionMarkers';
import { Button } from '../../forms/button/Button';
import { Calendar } from './Calendar';
import { CalendarEvent } from '../calendar-event/CalendarEvent';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaActions, Button, Calendar, CalendarEvent],
  template: `
    <p class="sub">Week — Tab once into the grid, walk it with the arrows, Enter into a chip, Escape back out</p>
    <div class="box">
      <arena-calendar timeZone="UTC" anchorDate="2027-03-15" view="week"
                      dayStart="09:00" dayEnd="18:00"
                      (dateClick)="picked.set($event)" (rangeChange)="moved.set($event)">
        <arena-button actions size="sm" variant="secondary">New class</arena-button>

        <arena-calendar-event id="standup" title="Standup" [colorId]="1"
                              start="2027-03-15T09:00:00Z" end="2027-03-15T09:30:00Z"
                              (click)="opened.set('Standup')" />
        <arena-calendar-event id="review" title="Design review, a long title that has to ellipsise"
                              [colorId]="2" start="2027-03-16T10:00:00Z" end="2027-03-16T12:00:00Z"
                              actionsEnabled (click)="opened.set('Design review')">
          <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-pencil">Edit</arena-button>
          <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-trash">Delete</arena-button>
        </arena-calendar-event>
        <arena-calendar-event id="vendor" title="Vendor sync" [colorId]="3"
                              start="2027-03-16T10:30:00Z" end="2027-03-16T13:00:00Z"
                              actionsEnabled (click)="opened.set('Vendor sync')">
          <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-pencil">Edit</arena-button>
        </arena-calendar-event>
        <arena-calendar-event id="onboarding" title="Onboarding" [colorId]="4"
                              start="2027-03-17T14:00:00Z" end="2027-03-17T17:00:00Z"
                              (click)="opened.set('Onboarding')" />
        <arena-calendar-event id="retro" title="Retro" [colorId]="5" disabled
                              start="2027-03-18T11:00:00Z" end="2027-03-18T11:30:00Z"
                              (click)="opened.set('Retro')" />
        <arena-calendar-event id="all-hands" title="All hands" [colorId]="6"
                              start="2027-03-19T09:00:00Z" end="2027-03-19T18:00:00Z"
                              actionsEnabled (click)="opened.set('All hands')">
          <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-pencil">Edit</arena-button>
        </arena-calendar-event>
      </arena-calendar>
    </div>
    <p class="log">last activated: {{ opened() || '—' }} · Retro is disabled and must never appear here</p>
    <p class="log">last date clicked: {{ picked() || '—' }} · last range: {{ moved() || '—' }}</p>

    <p class="sub">Day view in a narrow container — the same events, one column, chips at full width</p>
    <div class="squeezed">
      <arena-calendar timeZone="UTC" anchorDate="2027-03-16" view="day"
                      dayStart="09:00" dayEnd="14:00">
        <arena-calendar-event id="review-day" title="Design review" [colorId]="2"
                              start="2027-03-16T10:00:00Z" end="2027-03-16T12:00:00Z"
                              actionsEnabled (click)="opened.set('Design review')">
          <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-pencil">Edit</arena-button>
        </arena-calendar-event>
        <arena-calendar-event id="vendor-day" title="Vendor sync" [colorId]="3"
                              start="2027-03-16T10:30:00Z" end="2027-03-16T13:00:00Z"
                              (click)="opened.set('Vendor sync')" />
      </arena-calendar>
    </div>

    <p class="sub">Empty — a week with nothing booked is a legitimate render, not a caller's mistake</p>
    <div class="squeezed">
      <arena-calendar timeZone="UTC" anchorDate="2027-03-15" view="week" dayStart="09:00" dayEnd="12:00" />
    </div>
  `,
})
class CalendarCard {
  protected readonly opened = signal('');

  protected readonly picked = signal('');

  protected readonly moved = signal('');
}

bootstrapApplication(CalendarCard, { providers: [provideZonelessChangeDetection()] });
