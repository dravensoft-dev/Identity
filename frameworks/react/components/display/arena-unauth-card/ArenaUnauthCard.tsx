import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './ArenaUnauthCard.classes.generated.ts';
import { ArenaCard } from '../arena-card/ArenaCard.tsx';

export interface ArenaUnauthCardProps {

  /** The brand lock-up above the panel's content. An ArenaAppLogo, in practice. */
  brand?: React.ReactNode;

  /** Mono crimson microlabel: the product, not the task. */
  eyebrow?: string;

  /** The task. "Welcome back", "Check your inbox". */
  title?: string;

  /** Centred muted line below the content: a recovery link, a legal note. */
  footer?: React.ReactNode;

  /** The fields, composed from ArenaInput and ArenaButton. */
  children?: React.ReactNode;
}


const unauthStyles = arenaStyles(manifest);

export function ArenaUnauthCard({ brand, eyebrow, title, footer, children }: ArenaUnauthCardProps) {
  const styles = unauthStyles();
  return (
    <div className={styles.root()}>
      <ArenaCard>
        <div className={styles.body()}>
          {brand && <div className={styles.brand()}>{brand}</div>}
          {eyebrow && <div className={styles.eyebrow()}>{eyebrow}</div>}
          {title && <div className={styles.title()}>{title}</div>}
          {children}
          {footer && <div className={styles.footer()}>{footer}</div>}
        </div>
      </ArenaCard>
    </div>
  );
}
