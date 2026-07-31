import { Injectable, InjectionToken, Provider, signal, effect, inject, DOCUMENT } from '@angular/core';

export type ArenaTheme = string;

export interface ArenaPalette {
  name: string;
  polarity: 'dark' | 'light';
}

export interface ArenaThemeConfig {
  palettes: ArenaPalette[];
  default?: string;
}

export const DEFAULT_THEMES: ArenaThemeConfig = {
  palettes: [{ name: 'dark', polarity: 'dark' }, { name: 'light', polarity: 'light' }],
  default: 'dark',
};

export const ARENA_THEMES = new InjectionToken<ArenaThemeConfig>('ARENA_THEMES', {
  providedIn: 'root',
  factory: () => DEFAULT_THEMES,
});

export function provideArenaThemes(config: ArenaThemeConfig): Provider {
  return { provide: ARENA_THEMES, useValue: config };
}

export const themeClass = (name: string): string => `arena-${name}`;

const STORAGE_KEY = 'arena-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly config = inject(ARENA_THEMES);

  readonly palettes = this.config.palettes;
  readonly fallback = this.config.default ?? this.config.palettes[0].name;
  readonly theme = signal<ArenaTheme>(this.initial());

  constructor() {
    effect(() => {
      const current = this.theme();
      const classes = this.doc.documentElement.classList;
      for (const palette of this.palettes) {
        classes.toggle(themeClass(palette.name), palette.name === current && current !== this.fallback);
      }
      this.doc.defaultView?.localStorage?.setItem(STORAGE_KEY, current);
    });
  }

  set(theme: ArenaTheme): void {
    if (!this.declares(theme)) {
      throw new Error(`ThemeService: no palette named "${theme}"; the declared palettes are ${this.names().join(', ')}`);
    }
    this.theme.set(theme);
  }

  toggle(): void {
    const names = this.names();
    const at = names.indexOf(this.theme());
    this.theme.set(names[(at + 1) % names.length]);
  }

  polarityOf(theme: ArenaTheme): 'dark' | 'light' | null {
    return this.palettes.find((p) => p.name === theme)?.polarity ?? null;
  }

  private names(): string[] {
    return this.palettes.map((p) => p.name);
  }

  private declares(theme: ArenaTheme): boolean {
    return this.names().includes(theme);
  }

  private initial(): ArenaTheme {
    const stored = this.doc.defaultView?.localStorage?.getItem(STORAGE_KEY);
    if (stored && this.declares(stored)) return stored;
    const prefersLight = this.doc.defaultView?.matchMedia('(prefers-color-scheme: light)').matches;
    const preferred = this.palettes.find((p) => p.polarity === (prefersLight ? 'light' : 'dark'));
    return preferred?.name ?? this.fallback;
  }
}
