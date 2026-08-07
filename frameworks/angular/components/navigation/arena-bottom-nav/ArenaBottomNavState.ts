import { Injectable, Signal, signal } from '@angular/core';

@Injectable()
export class ArenaBottomNavState {
  activeId: Signal<string | undefined> = signal(undefined);
  activate: (id: string) => void = () => {};
}
