import { Injectable, Signal, signal } from '@angular/core';

export abstract class ArenaSideNavChild {}

@Injectable()
export class ArenaSideNavState {
  depth: Signal<number> = signal(0);
  activeId: Signal<string | undefined> = signal(undefined);
  indentStep: Signal<number> = signal(3);
  activate: (id: string) => void = () => {};
}

export function arenaIndentFor(indentStep: number, depth: number): string {
  const steps = indentStep * depth;
  return steps === 0
    ? 'calc(var(--sp-1) * 3)'
    : `calc(var(--sp-1) * 3 + var(--sp-1) * ${steps})`;
}
