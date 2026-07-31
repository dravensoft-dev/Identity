import { useEffect, useState } from 'react';

export const DEFAULT_THEMES = {
  palettes: [{ name: 'dark', polarity: 'dark' }, { name: 'light', polarity: 'light' }],
  default: 'dark',
};

export const themeClass = (name) => `arena-${name}`;

const STORAGE_KEY = 'arena-theme';

let config = DEFAULT_THEMES;
const listeners = new Set();
let current = null;

const names = () => config.palettes.map((p) => p.name);
const fallback = () => config.default ?? config.palettes[0].name;
const declares = (name) => names().includes(name);

const root = () => (typeof document === 'undefined' ? null : document.documentElement);

function stored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(name) {
  try {
    window.localStorage.setItem(STORAGE_KEY, name);
  } catch {
    return;
  }
}

function preferred() {
  const light = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const match = config.palettes.find((p) => p.polarity === (light ? 'light' : 'dark'));
  return match?.name ?? fallback();
}

function apply(name) {
  const element = root();
  if (!element) return;
  for (const palette of config.palettes) {
    element.classList.toggle(themeClass(palette.name), palette.name === name && name !== fallback());
  }
}

export function getArenaTheme() {
  if (current === null) current = declares(stored()) ? stored() : preferred();
  return current;
}

export function setArenaTheme(name) {
  if (!declares(name)) {
    throw new Error(`setArenaTheme: no palette named "${name}"; the declared palettes are ${names().join(', ')}`);
  }
  current = name;
  apply(name);
  remember(name);
  for (const listener of listeners) listener(name);
  return name;
}

export function initArenaTheme(themes = DEFAULT_THEMES) {
  config = themes;
  current = null;
  const name = getArenaTheme();
  apply(name);
  return name;
}

export function arenaPalettes() {
  return config.palettes;
}

export function toggleArenaTheme() {
  const all = names();
  return setArenaTheme(all[(all.indexOf(getArenaTheme()) + 1) % all.length]);
}

export function useArenaTheme() {
  const [theme, setTheme] = useState(getArenaTheme);
  useEffect(() => {
    listeners.add(setTheme);
    setTheme(getArenaTheme());
    return () => listeners.delete(setTheme);
  }, []);
  return [theme, setArenaTheme];
}
