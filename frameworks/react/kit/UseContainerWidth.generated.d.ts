import type * as React from 'react';
export declare function useContainerWidth<T extends Element = HTMLDivElement>(): [
    React.RefObject<T>,
    number | null
];
export declare function readBreakpoint(name: 'sm' | 'md' | 'lg'): number;
