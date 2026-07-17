import { tv } from '../../../tailwind/tv';

export const tagStyles = tv({
  slots: {
    root: 'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
    dot: 'h-1.5 w-1.5 rounded-full bg-[currentColor]',
  },
  variants: {
    tone: {
      neutral: { root: 'border-base-300 text-base-content/70' },
      primary: { root: 'border-primary text-primary' },
      success: { root: 'border-success text-success' },
      warning: { root: 'border-warning text-warning' },
      danger: { root: 'border-error text-error' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});
