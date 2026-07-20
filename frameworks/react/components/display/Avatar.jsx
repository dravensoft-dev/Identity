import React from 'react';
const SIZES = { xs: 'var(--avatar-xs)', sm: 'var(--avatar-sm)', md: 'var(--avatar-md)', lg: 'var(--avatar-lg)' };
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
