/* frameworks/angular/icons/icon-manifest.ts
   Canonical role > Phosphor glyph map. Seed a consumer's icon registry from this
   instead of guessing. Bold is the default weight; Fill = active/selected;
   Duotone = onboarding only. Glyph names are Phosphor webfont classes (ph-*). */
export interface ArenaIcon {
  role: string;
  phosphor: string;
  weight: 'bold' | 'fill' | 'duotone';
}

export const ARENA_ICONS: ArenaIcon[] = [
  { role: 'nav-home',      phosphor: 'ph-house',           weight: 'bold' },
  { role: 'nav-active',    phosphor: 'ph-house',           weight: 'fill' },
  { role: 'confirm',       phosphor: 'ph-check',           weight: 'bold' },
  { role: 'dismiss',       phosphor: 'ph-x',               weight: 'bold' },
  { role: 'danger',        phosphor: 'ph-trash',           weight: 'bold' },
  { role: 'search',        phosphor: 'ph-magnifying-glass', weight: 'bold' },
  { role: 'add',           phosphor: 'ph-plus',            weight: 'bold' },
  { role: 'more',          phosphor: 'ph-dots-three',      weight: 'bold' },
  { role: 'expand',        phosphor: 'ph-caret-down',      weight: 'bold' },
  { role: 'back',          phosphor: 'ph-caret-left',      weight: 'bold' },
  { role: 'forward',       phosphor: 'ph-caret-right',     weight: 'bold' },
  { role: 'success',       phosphor: 'ph-check-circle',    weight: 'fill' },
  { role: 'warning',       phosphor: 'ph-warning',         weight: 'fill' },
  { role: 'error',         phosphor: 'ph-warning-circle',  weight: 'fill' },
  { role: 'info',          phosphor: 'ph-info',            weight: 'fill' },
  { role: 'user',          phosphor: 'ph-user',            weight: 'bold' },
  { role: 'settings',      phosphor: 'ph-gear',            weight: 'bold' },
  { role: 'onboarding',    phosphor: 'ph-sparkle',         weight: 'duotone' },
];
