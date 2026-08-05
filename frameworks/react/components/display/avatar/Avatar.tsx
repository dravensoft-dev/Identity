import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Avatar.classes.generated.ts';

import type { ArenaAvatarSize, ArenaAvatarShape, ArenaAvatarStatus } from '../../../Api.generated';

export interface AvatarProps {
  /** Image URL. Absent renders initials from `name`. */
  src?: string;
  /** The person or entity name. Its first two words' initials render when there is no `src`, and it is the image's alt text. */
  name?: string;
  /** The avatar's diameter. */
  size?: ArenaAvatarSize;
  /** Circle for a person, rounded for a team. */
  shape?: ArenaAvatarShape;
  /** A presence dot in the state's colour. `offline` is a visible muted dot; omit `status` entirely for no dot. Optional: there is no invisible enum value. */
  status?: ArenaAvatarStatus;
}

const avatarStyles = arenaStyles(manifest);
const STATUSES = Object.keys(manifest.variants.status);
type Status = keyof typeof manifest.variants.status;
const statusOf = (status: string | undefined): Status | undefined =>
  (status && STATUSES.includes(status) ? status as Status : 'offline');

export function Avatar({ src, name = '', size = 'md', shape = 'circle', status }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
  const styles = avatarStyles({ size, shape, status: status ? statusOf(status) : 'none' });
  return (
    <span className={styles.root()}>
      <span className={styles.box()}>
        {src ? <img src={src} alt={name} className={styles.image()} /> : initials}
      </span>
      {status && <span aria-label={status} title={status} className={styles.status()} />}
    </span>
  );
}
