import React from 'react';

import type { TagTone } from '../../../Api.generated';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Tag.classes.generated.ts';

export interface TagProps {
  /** The tag's label. */
  children?: React.ReactNode;
  /** The tag's emphasis colour. */
  tone?: TagTone;
  /** Whether the dismiss × is shown. Every layer gates the × on this member and never on whether anything listens for `remove`, because Arena never derives what it draws from what a consumer listens for. Removability is a declared input, not something inferred from the event. */
  removable?: boolean;
  /** Whether removal is unavailable while the tag stays visible: a filter a consumer's permissions lock, not a tag that is merely inert. It reflects through `aria-disabled` rather than the native `disabled` attribute, so the × keeps its place in the tab order and a screen-reader user is told the action is unavailable instead of never finding it. With `removable` false there is no × and nothing to disable. */
  disabled?: boolean;
  /** The dismiss × was activated. Never emitted while `disabled`. */
  onRemove?: () => void;
}


const tagStyles = arenaStyles(manifest);

export function Tag({ children, tone = 'neutral', removable = false, disabled = false, onRemove }: TagProps) {
  const styles = tagStyles({ tone, disabled });
  return (
    <span className={styles.root()}>
      <span aria-hidden="true" className={styles.dot()} />
      {children}
      {removable && <button type="button" className={styles.close()} aria-label="Remove"
        aria-disabled={disabled ? 'true' : undefined}
        onClick={disabled ? undefined : onRemove}><i className="ph-bold ph-x" aria-hidden="true" /></button>}
    </span>
  );
}
