/* frameworks/angular/theme/theme-service.ts
   Dark-first theme service. Default is dark (:root); light toggles the
   `.arena-light` class on <html>. Persists to localStorage under `arena-theme`;
   falls back to prefers-color-scheme. Pair with no-fouc.html to apply the stored
   theme before first paint (same storage key). */
import { Injectable, signal, effect, inject, DOCUMENT } from '@angular/core';

export type ArenaTheme = 'dark' | 'light';

const STORAGE_KEY = 'arena-theme';
const LIGHT_CLASS = 'arena-light';

/** Reads/writes Arena's dark-first theme and reflects it onto <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<ArenaTheme>(this.initial());

  constructor() {
    effect(() => {
      const light = this.theme() === 'light';
      this.doc.documentElement.classList.toggle(LIGHT_CLASS, light);
      this.doc.defaultView?.localStorage?.setItem(STORAGE_KEY, this.theme());
    });
  }

  set(theme: ArenaTheme): void {
    this.theme.set(theme);
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private initial(): ArenaTheme {
    const stored = this.doc.defaultView?.localStorage?.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersLight = this.doc.defaultView?.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
}
