export const WEIGHTS = ['ph-thin', 'ph-light', 'ph-bold', 'ph-duotone', 'ph-fill'];

export function activeWeight(icon: string): string {
  const parts = icon.split(/\s+/).filter(Boolean);
  if (parts.includes('ph-fill')) return icon;
  const replaced = parts.map((part) => (WEIGHTS.includes(part) ? 'ph-fill' : part));
  return replaced.includes('ph-fill') ? replaced.join(' ') : ['ph-fill', ...replaced].join(' ');
}

export function badgeCount(badge: number | undefined): string | null {
  if (badge === undefined || !(badge > 0)) return null;
  return badge > 99 ? '99+' : String(Math.floor(badge));
}
