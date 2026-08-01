export declare function showsTime(chipHeight: number, slotWidth: number | null): boolean;
export declare function stacksActions(chipHeight: number, slotWidth: number | null): boolean;
export interface CalendarDate {
    y: number;
    m: number;
    d: number;
}
export interface ZonedParts extends CalendarDate {
    hh: number;
    mm: number;
}
export declare function zonedParts(iso: string | undefined, timeZone: string): ZonedParts | null;
export declare const isoDateOf: (p: CalendarDate) => string;
export declare const minutesOf: (p: ZonedParts) => number;
export declare const formatHM: (min: number) => string;
export declare function parseHM(value: string | undefined, fallback: number): number;
export declare function addDays(isoDate: string, n: number): string;
export declare const weekdayOf: (isoDate: string) => number;
export declare function startOfWeek(isoDate: string, weekStartsOn?: number): string;
export declare const todayIso: (timeZone: string) => string;
export declare const nowMinutes: (timeZone: string) => number;
export interface CalendarEventData {
    id?: string;
    start?: string;
    end?: string;
    colorId?: number;
}
export interface Placement<T extends CalendarEventData = CalendarEventData> {
    ev: T;
    dayIso: string;
    startMin: number;
    endMin: number;
}
export interface LaidOut<T extends CalendarEventData = CalendarEventData> extends Placement<T> {
    col: number;
    cols: number;
}
export declare function placeEvents<T extends CalendarEventData>(events: T[] | undefined, timeZone: string): Placement<T>[];
export declare function layoutDay<T extends CalendarEventData>(placements: Placement<T>[]): LaidOut<T>[];
export declare function defaultDayStart(placements: Placement<CalendarEventData>[], fallback?: number): number;
export declare const formatDate: (isoDate: string, opts?: Intl.DateTimeFormatOptions) => string;
export declare function rangeTitle(days: string[]): string;
