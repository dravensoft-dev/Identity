import React from 'react';

import { isPrimaryActivation } from '../../../AnchorActivation.ts';
import type { Crumb } from '../../../Api.generated';

export type { Crumb };
export interface BreadcrumbsProps {

  /** Names this navigation landmark. Required, and guarded at runtime: nothing can derive it, and the constant "Breadcrumb" it used to hardcode made two trails on one page indistinguishable as landmarks while satisfying the requirement mechanically. Say which hierarchy this is a trail through: "Project navigation", never "Breadcrumb". */
  ariaLabel: string;

  /** The trail, root first. The last entry is the current location and is never a link. */
  items: Crumb[];

  /** Drawn between crumbs, never before the first. Arena draws it, in its own aria-hidden span. */
  separator?: string;

  /** A non-current crumb was activated, carrying that crumb alone. The native MouseEvent is not forwarded, because a platform event type is an R4 violation inside a payload; what the listener needs from it, the chance to route instead of navigating, arrives as behaviour rather than as data. Arena has already cancelled the anchor by the time this fires, so a listener routes and does not double-navigate. It fires for a primary click with no modifier and for Enter; ctrl-click, middle-click and open-in-new-tab are the browser's and fire nothing, so a consumer who wires no listener still has a working trail of real links. */
  onNavigate?: (crumb: Crumb) => void;
}


export function Breadcrumbs({ items, ariaLabel, separator = '/', onNavigate }: BreadcrumbsProps) {
  if (!ariaLabel?.trim()) throw new Error('Breadcrumbs: `ariaLabel` is required');
  if (!items) throw new Error('Breadcrumbs: `items` is required');
  return (
    <nav aria-label={ariaLabel} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'calc(var(--sp-1) * 2)' }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const common = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-mono-nav)' };
        return (
          <React.Fragment key={i}>
            {last ? (
              <span aria-current="page" style={{ ...common, color: 'var(--bone)', fontWeight: 'var(--fw-bold)' }}>{it.label}</span>
            ) : (
              <a href={it.href || '#'}
                onClick={(e) => {
                  if (!isPrimaryActivation(e)) return;
                  e.preventDefault();
                  onNavigate?.(it);
                }}
                style={{ ...common, color: 'var(--mute)', textDecoration: 'none', cursor: 'pointer', transition: 'color var(--dur-fast) var(--ease-out)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mute)')}>
                {it.label}
              </a>
            )}
            {!last && <span aria-hidden="true" style={{ color: 'var(--line-strong)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)' }}>{separator}</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
