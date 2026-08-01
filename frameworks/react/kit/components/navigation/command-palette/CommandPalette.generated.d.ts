import React from 'react';
import type { Command } from '../../../Api.generated';
export type { Command };
export interface CommandPaletteProps {
    open: boolean;
    commands: Command[];
    placeholder?: string;
    onClose?: () => void;
    onRun?: (command: Command) => void;
}
export declare function CommandPalette({ open, commands, placeholder, onClose, onRun }: CommandPaletteProps): React.JSX.Element | null;
