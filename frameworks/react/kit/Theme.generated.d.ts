export type ArenaPolarity = 'dark' | 'light';
export interface ArenaPalette {
    name: string;
    polarity: ArenaPolarity;
}
export interface ArenaThemeConfig {
    palettes: ArenaPalette[];
    default?: string;
}
export declare const DEFAULT_THEMES: ArenaThemeConfig;
export declare const themeClass: (name: string) => string;
export declare function getArenaTheme(): string;
export declare function setArenaTheme(name: string): string;
export declare function initArenaTheme(themes?: ArenaThemeConfig): string;
export declare function arenaPalettes(): ArenaPalette[];
export declare function toggleArenaTheme(): string;
export declare function useArenaTheme(): [string, (name: string) => string];
