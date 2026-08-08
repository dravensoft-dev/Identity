export const ARENA_LEGEND_STRIP_STYLE = {
  display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 4)',
  overflow: 'hidden', whiteSpace: 'nowrap',
} as const satisfies Readonly<Record<string, string>>;

export const ARENA_LEGEND_ITEM_STYLE = {
  display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', minWidth: 0,
} as const satisfies Readonly<Record<string, string | number>>;

export const ARENA_LEGEND_SWATCH_STYLE = {
  width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)',
  borderRadius: 'var(--r-xs)', flexShrink: 0,
} as const satisfies Readonly<Record<string, string | number>>;

export const ARENA_LEGEND_LABEL_STYLE = {
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--text-body)',
} as const satisfies Readonly<Record<string, string>>;
