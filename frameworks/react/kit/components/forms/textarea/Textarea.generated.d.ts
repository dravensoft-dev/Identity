import React from 'react';
export interface TextareaProps {
    label?: string;
    id?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    counter?: boolean;
    autoResize?: boolean;
    value?: string;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    name?: string;
    maxLength?: number;
    rows?: number;
    onChange?: (value: string) => void;
}
export declare function borderBoxSlack(element: HTMLElement): number;
export declare function fitToContent(element: HTMLElement | null): void;
export declare function Textarea({ label, id, hint, error, required, rows, maxLength, counter, disabled, readOnly, autoResize, placeholder, name, value, onChange, }: TextareaProps): React.JSX.Element;
