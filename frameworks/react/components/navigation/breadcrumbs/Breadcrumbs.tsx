import React from 'react';

import { isPrimaryActivation } from '../../../AnchorActivation.ts';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Breadcrumbs.classes.generated.ts';
import type { Crumb } from '../../../Api.generated';

export type { Crumb };
export interface BreadcrumbsProps {

  /** Names this navigation landmark. Required, and guarded at runtime: nothing can derive it, and the constant "Breadcrumb" it used to hardcode made two trails on one page indistinguishable as landmarks while satisfying the requirement mechanically. Say which hierarchy this is a trail through: "Project navigation", never "Breadcrumb". */
  ariaLabel: string;

  /** The trail, root first. The last entry is the current location and is never a link. */
  items: readonly Crumb[];

  /** Drawn between crumbs, never before the first. Arena draws it, in its own aria-hidden span. */
  separator?: string;

  /** A non-current crumb was activated, carrying that crumb alone. The native MouseEvent is not forwarded, because a platform's own event type never travels in a payload; what the listener needs from it, the chance to route instead of navigating, arrives as behaviour rather than as data. Arena has already cancelled the anchor by the time this fires, so a listener routes and does not double-navigate. It fires for a primary click with no modifier and for Enter; ctrl-click, middle-click and open-in-new-tab are the browser's and fire nothing, so a consumer who wires no listener still has a working trail of real links. */
  onNavigate?: (crumb: Crumb) => void;
}


const breadcrumbStyles = arenaStyles(manifest);

export function Breadcrumbs({ items, ariaLabel, separator = '/', onNavigate }: BreadcrumbsProps) {
  if (!ariaLabel?.trim()) throw new Error('Breadcrumbs: `ariaLabel` is required');
  if (!items) throw new Error('Breadcrumbs: `items` is required');
  const styles = breadcrumbStyles();
  return (
    <nav aria-label={ariaLabel} className={styles.root()}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {last ? (
              <span aria-current="page" className={styles.current()}>{it.label}</span>
            ) : (
              <a href={it.href || '#'}
                onClick={(e) => {
                  if (!isPrimaryActivation(e)) return;
                  e.preventDefault();
                  onNavigate?.(it);
                }}
                className={styles.crumb()}>
                {it.label}
              </a>
            )}
            {!last && <span aria-hidden="true" className={styles.separator()}>{separator}</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
