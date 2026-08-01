import type * as React from 'react';
import type { SeriesTone } from './Api.generated';
export declare const CAT_SLOTS = 8;
export declare const CHART_HEIGHT = 280;
export declare const PAD: {
    t: number;
    r: number;
    b: number;
    l: number;
};
export declare function catColor(slot: number): string;
export declare const toneColor: (tone: SeriesTone) => string | undefined;
export interface ResolveColorsOptions {
    slot?: number;
    slots?: number[];
    tone?: SeriesTone;
    count: number;
}
export declare function resolveColors({ slot, slots, tone, count }: ResolveColorsOptions): string[];
export declare function niceMax(max: number): number;
export declare function ticks(max: number, count?: number): number[];
export declare function barPath(x: number, y: number, w: number, h: number, r: number): string;
export declare function arcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string;
export declare const srOnly: React.CSSProperties;
