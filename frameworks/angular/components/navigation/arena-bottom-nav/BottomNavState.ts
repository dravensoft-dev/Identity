import { Injectable, Signal, signal } from '@angular/core';

@Injectable()
export class BottomNavState {
  activeId: Signal<string | undefined> = signal(undefined);
  activate: (id: string) => void = () => {};
}
