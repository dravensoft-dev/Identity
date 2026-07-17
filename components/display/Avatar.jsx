import React from 'react';
const SIZES = { xs: 24, sm: 32, md: 40, lg: 56 };
const STATUS = { online: 'var(--success)', busy: 'var(--danger)', away: 'var(--warning)', offline: 'var(--status-offline)' };
/** Representation of a person or entity. `src` for image; without it, initials on panel.
 * `shape` circle (people) or rounded (teams/orgs). `status` adds a presence dot. */
export function Avatar({ src, name = '', size = 'md', shape = 'circle', status, style, ...rest }) {
  const d = SIZES[size] || SIZES.md;
  const radius = shape === 'rounded' ? 'var(--r-md)' : '50%';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: d, height: d, flexShrink: 0, ...style }} {...rest}>
      <span style={{ width: d, height: d, borderRadius: radius, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-base-300)', border: '1px solid var(--line-strong)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: d * 0.4, color: 'var(--bone-dim)', letterSpacing: '.02em' }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </span>
      {status && (
        <span aria-label={status} title={status}
          style={{ position: 'absolute', right: -1, bottom: -1, width: Math.max(8, d * 0.28), height: Math.max(8, d * 0.28),
            borderRadius: '50%', background: STATUS[status] || STATUS.offline, border: '2px solid var(--surface-card)' }} />
      )}
    </span>
  );
}
