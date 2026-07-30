import { Injectable, type Signal, signal } from '@angular/core';

@Injectable()
export class RadioGroupState {
  groupName: Signal<string> = signal('');
  selected: Signal<string | undefined> = signal(undefined);
  choose: (value: string) => void = () => {};
}
