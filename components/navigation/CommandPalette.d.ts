import * as React from 'react';
/** Paleta de comandos (Cmd/Ctrl+K). Navegación por flechas, Enter ejecuta, Esc cierra. */
export interface Command { id?: string; label: string; hint?: string; icon?: React.ReactNode; shortcut?: string; onRun?: () => void; }
export interface CommandPaletteProps {
  open: boolean; onClose?: () => void; commands?: Command[]; placeholder?: string;
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null;
