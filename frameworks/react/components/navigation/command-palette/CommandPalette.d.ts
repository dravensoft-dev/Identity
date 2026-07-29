import type { Command } from '../../api.generated';

export type { Command };

/** Command palette (Cmd/Ctrl+K). Arrow-key navigation, Enter runs, Esc closes. */
export interface CommandPaletteProps {
  /** Whether the palette is shown. Closed renders nothing. */
  open: boolean;
  /** Every command the palette can find. Filtered by label and hint as the user types. */
  commands: Command[];
  /** The search field's placeholder. */
  placeholder?: string;
  /** The palette asked to be closed — Escape, the scrim, or a command having been run. */
  onClose?: () => void;
  /** A command was activated, carrying which one. Emitted after onClose. */
  onRun?: (command: Command) => void;
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null;
