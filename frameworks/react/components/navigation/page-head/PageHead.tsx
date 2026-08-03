import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './PageHead.classes.generated.ts';
import { useContainerWidth, readBreakpoint } from '../../../UseContainerWidth.ts';

import type { PageHeadAlign } from '../../../Api.generated';

export interface PageHeadProps {

  /** The page title. Required: a page head with no title is a bug, not a state. */
  title: string;

  /** A muted line under the title. */
  subtitle?: string;

  /** Page-level controls, right-aligned in the head. */
  actions?: React.ReactNode;

  /** Cross-axis alignment of the actions block against the title, wide layout only. */
  align?: PageHeadAlign;
}


const pageHeadStyles = arenaStyles(manifest);

export function PageHead({ title, subtitle, actions, align = 'start' }: PageHeadProps) {
  if (!title) throw new Error('PageHead: `title` is required');
  const [ref, width] = useContainerWidth();
  const narrow = width !== null && width < readBreakpoint('sm');
  const styles = pageHeadStyles({ narrow, align });

  return (
    <div ref={ref} className={styles.root()}>
      <div className={styles.titles()}>
        <h1 className={styles.title()}>{title}</h1>
        {subtitle && <p className={styles.subtitle()}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions()}>{actions}</div>}
    </div>
  );
}
