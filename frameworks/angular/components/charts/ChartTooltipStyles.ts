export const ARENA_TOOLTIP_STYLE = {
  position: 'absolute', transform: 'translate(-50%,-100%)', pointerEvents: 'none',
  whiteSpace: 'nowrap', background: 'var(--bg-raised)',
  border: 'var(--bw) solid var(--border-strong)', borderRadius: 'var(--r-sm)',
  boxShadow: 'var(--shadow-2)', padding: 'calc(var(--sp-1) * 1.5) calc(var(--sp-1) * 2.5)',
} as const satisfies Readonly<Record<string, string>>;

export const ARENA_TOOLTIP_LABEL_STYLE = {
  fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-xs)', color: 'var(--mute)',
} as const satisfies Readonly<Record<string, string>>;

export const ARENA_TOOLTIP_VALUE_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--bone)',
} as const satisfies Readonly<Record<string, string>>;
