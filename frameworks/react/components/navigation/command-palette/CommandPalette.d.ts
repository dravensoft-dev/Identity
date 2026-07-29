import type { Command } from '../../../Api.generated';

export type { Command };

export interface CommandPaletteProps {

  open: boolean;

  commands: Command[];

  placeholder?: string;

  onClose?: () => void;

  onRun?: (command: Command) => void;
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null;
