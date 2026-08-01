import React from 'react';

import type { AvatarSize, AvatarShape, AvatarStatus } from '../../../Api.generated';

export interface AvatarProps {
  /** Image URL. Absent renders initials from `name`. */
  src?: string;
  /** The person or entity name. Its first two words' initials render when there is no `src`, and it is the image's alt text. */
  name?: string;
  /** The avatar's diameter. */
  size?: AvatarSize;
  /** Circle for a person, rounded for a team. */
  shape?: AvatarShape;
  /** A presence dot in the state's colour. `offline` is a visible muted dot; omit `status` entirely for no dot. Optional — there is no invisible enum value. */
  status?: AvatarStatus;
}

const SIZES = { xs: 'var(--avatar-xs)', sm: 'var(--avatar-sm)', md: 'var(--avatar-md)', lg: 'var(--avatar-lg)' };
const STATUS = { online: 'var(--success)', busy: 'var(--danger)', away: 'var(--warning)', offline: 'var(--status-offline)' };

export function Avatar({ src, name = '', size = 'md', shape = 'circle', status }: AvatarProps) {
  const d = SIZES[size] || SIZES.md;
  const radius = shape === 'rounded' ? 'var(--r-md)' : '50%';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: d, height: d, flexShrink: 0 }}>
      <span style={{ width: d, height: d, borderRadius: radius, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-base-300)', border: 'var(--bw) solid var(--line-strong)',
        fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: `calc(${d} * 0.4)`, color: 'var(--bone-dim)', letterSpacing: 'var(--ls-normal)' }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </span>
      {status && (
        <span aria-label={status} title={status}
          style={{ position: 'absolute', right: 0, bottom: 0, width: `max(calc(var(--sp-1) * 2), calc(${d} * 0.28))`, height: `max(calc(var(--sp-1) * 2), calc(${d} * 0.28))`,
            borderRadius: '50%', background: STATUS[status] || STATUS.offline, border: 'var(--bw-strong) solid var(--surface-card)' }} />
      )}
    </span>
  );
}
