import React from 'react';
export interface SideNavInjected {
    depth: number;
    indentStep: number;
    activeId?: string;
    onActivate?: (id: string) => void;
}
export declare function injectInto(children: React.ReactNode, injected: SideNavInjected): React.ReactNode[];
export declare function indentFor(indentStep: number, depth: number): string;
export declare const COLUMN: React.CSSProperties;
export interface RowStyleOptions {
    indentStep: number;
    depth: number;
    background?: string;
    color?: string;
    fontWeight?: string;
    textDecoration?: string;
    opacity?: number;
    cursor?: string;
}
export declare function rowStyle({ indentStep, depth, background, color, fontWeight, textDecoration, opacity, cursor, }: RowStyleOptions): React.CSSProperties;
export declare function rowGlyph(icon: string | undefined): React.ReactElement | null;
