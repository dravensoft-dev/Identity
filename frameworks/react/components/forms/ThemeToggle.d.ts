import * as React from 'react';

/** Dark/light toggle, built on IconButton. Owns no state: it reads and writes
 *  the `arena-light` class on <html> through theme.js. */
export interface ThemeToggleProps {
  /** @startingPoint Omit it — the default names both directions correctly.
   *  Receives the CURRENT dark state and returns the accessible name. */
  label?: (isDark: boolean) => string;
  style?: React.CSSProperties;
}
export function ThemeToggle(props: ThemeToggleProps): JSX.Element;
