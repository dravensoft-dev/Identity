const warned = new Set<string>();

export function warnOnce(message: string): void {
  if (warned.has(message) || typeof console === 'undefined') return;
  warned.add(message);
  console.warn(`[arena] ${message}`);
}

export function forgetWarnings(): void {
  warned.clear();
}
