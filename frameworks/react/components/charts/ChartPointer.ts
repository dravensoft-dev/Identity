export function arenaCursorHandles(key: string): boolean {
  return key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End' || key === 'Escape';
}

export function arenaCursorStep(current: number | null, key: string, count: number): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  if (key === 'Escape') return null;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  if (key === 'ArrowRight') return current === null ? 0 : Math.min(last, current + 1);
  if (key === 'ArrowLeft') return current === null ? last : Math.max(0, current - 1);
  return current;
}

export function arenaPointerUpdates(pointerType: string, phase: string): boolean {
  if (phase === 'down') return true;
  return pointerType !== 'touch';
}

export function arenaPointerClears(pointerType: string): boolean {
  return pointerType !== 'touch';
}
