import '@angular/compiler';
import {
  ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Pagination } from './Pagination';

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Pagination],
  template: `
    <p class="sub">Seven pages fit whole — no ellipsis, and every page is one Tab away</p>
    <div class="row">
      <arena-pagination ariaLabel="Environments" [page]="small()" [pageCount]="7"
                        (change)="small.set($event)" />
    </div>

    <p class="sub">Twenty pages — walk to the middle and the window elides on both sides</p>
    <div class="row">
      <arena-pagination ariaLabel="Deployments" [page]="large()" [pageCount]="20"
                        (change)="large.set($event)" />
    </div>

    <p class="sub">Both ends — the arrow that would leave the range is disabled, not hidden</p>
    <div class="row">
      <arena-pagination ariaLabel="Builds, first page" [page]="1" [pageCount]="20" />
      <arena-pagination ariaLabel="Builds, last page" [page]="20" [pageCount]="20" />
    </div>

    <p class="sub">One page — the window is the whole set and both arrows are disabled</p>
    <div class="row">
      <arena-pagination ariaLabel="Incidents" [page]="1" [pageCount]="1" />
    </div>

    <p class="sub">small={{ small() }} · large={{ large() }}</p>
  `,
})
class PaginationCard {
  protected readonly small = signal(3);
  protected readonly large = signal(10);
}

bootstrapApplication(PaginationCard, { providers: [provideZonelessChangeDetection()] });
