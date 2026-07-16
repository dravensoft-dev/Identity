import * as React from 'react';
/** Command palette (Cmd/Ctrl+K). Arrow-key navigation, Enter runs, Esc closes. */
export interface Command { id?: string; label: string; hint?: string; icon?: React.ReactNode; shortcut?: string; onRun?: () => void; }
export interface CommandPaletteProps {
  open: boolean; onClose?: () => void; commands?: Command[]; placeholder?: string;
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null;
