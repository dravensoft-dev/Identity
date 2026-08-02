import { Injectable, Signal, signal } from '@angular/core';

export abstract class SideNavChild {}

@Injectable()
export class SideNavState {
  depth: Signal<number> = signal(0);
  activeId: Signal<string | undefined> = signal(undefined);
  indentStep: Signal<number> = signal(3);
  activate: (id: string) => void = () => {};
}

export function indentFor(indentStep: number, depth: number): string {
  const steps = indentStep * depth;
  return steps === 0
    ? 'calc(var(--sp-1) * 3)'
    : `calc(var(--sp-1) * 3 + var(--sp-1) * ${steps})`;
}

export const WEIGHTS = ['ph-thin', 'ph-light', 'ph-bold', 'ph-duotone', 'ph-fill'];

export function activeWeight(icon: string): string {
  const parts = icon.split(/\s+/).filter(Boolean);
  if (parts.includes('ph-fill')) return icon;
  const replaced = parts.map((part) => (WEIGHTS.includes(part) ? 'ph-fill' : part));
  return replaced.includes('ph-fill') ? replaced.join(' ') : ['ph-fill', ...replaced].join(' ');
}
