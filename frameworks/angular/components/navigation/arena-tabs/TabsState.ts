import { Injectable, type Signal, signal } from '@angular/core';

@Injectable()
export class TabsState {
  selected: Signal<string | undefined> = signal(undefined);
  tabId: (value: string) => string | null = () => null;
  panelId: (value: string) => string | null = () => null;
}
