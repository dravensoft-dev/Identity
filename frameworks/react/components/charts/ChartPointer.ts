export function arenaCursorForward(axis: string): string {
  return axis === 'y' ? 'ArrowDown' : 'ArrowRight';
}

export function arenaCursorBackward(axis: string): string {
  return axis === 'y' ? 'ArrowUp' : 'ArrowLeft';
}

export function arenaCursorHandles(key: string, axis: string): boolean {
  if (key === 'Home' || key === 'End' || key === 'Escape') return true;
  return key === arenaCursorForward(axis) || key === arenaCursorBackward(axis);
}

export function arenaCursorStep(current: number | null, key: string, count: number, axis: string): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  if (key === 'Escape') return null;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  if (key === arenaCursorForward(axis)) return current === null ? 0 : Math.min(last, current + 1);
  if (key === arenaCursorBackward(axis)) return current === null ? last : Math.max(0, current - 1);
  return current;
}

export function arenaPointerUpdates(pointerType: string, phase: string): boolean {
  if (phase === 'down') return true;
  return pointerType !== 'touch';
}

export function arenaPointerClears(pointerType: string): boolean {
  return pointerType !== 'touch';
}
