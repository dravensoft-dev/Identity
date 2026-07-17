import React, { useEffect, useState } from 'react';
import { IconButton } from './IconButton.jsx';

/* Owns no theme state: the truth is the `arena-light` class on <html>, and
 * this reads it. The MutationObserver is what keeps that honest — if theme.js
 * or another toggle flips the theme, every mounted toggle re-renders.
 *
 * theme.js is an IIFE with no exports, so the only handle it offers is
 * window.__toggleTheme. Use it when present; otherwise do the same two things
 * it does, against the same class and the same storage key. */
const STORAGE_KEY = 'draven-theme';
const isDarkNow = () =>
  typeof document !== 'undefined' && !document.documentElement.classList.contains('arena-light');

export function ThemeToggle({ label, ...rest }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(isDarkNow());
    const mo = new MutationObserver(() => setDark(isDarkNow()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  const toggle = () => {
    if (typeof window !== 'undefined' && typeof window.__toggleTheme === 'function') {
      window.__toggleTheme();
      return;
    }
    const goingLight = isDarkNow();
    document.documentElement.classList.toggle('arena-light', goingLight);
    try { localStorage.setItem(STORAGE_KEY, goingLight ? 'light' : 'dark'); } catch (_) {}
  };

  const name = label ? label(dark) : (dark ? 'Switch to light theme' : 'Switch to dark theme');

  return (
    /* aria-pressed reports the CURRENT dark state — the part most often missed.
     * The icon shows the state you are in, not the one you would go to. */
    <IconButton label={name} aria-pressed={dark} onClick={toggle} {...rest}>
      <i className={dark ? 'ph-bold ph-sun' : 'ph-bold ph-moon'} aria-hidden="true" />
    </IconButton>
  );
}
