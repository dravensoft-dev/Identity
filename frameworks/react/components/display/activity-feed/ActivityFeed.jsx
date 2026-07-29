import React from 'react';

/* Badge's vocabulary, taken rather than restated -- Badge defines it, StatCard
 * took it for its value, and this is the third. A fourth list that is nearly
 * the same as the first is how they drift apart. Only the foreground of each
 * pair is used here: the dot is a mark, not a chip. */
const TONES = {
  neutral: 'var(--bone-dim)', accent: 'var(--crimson)', gold: 'var(--gold)',
  success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--info)',
};

/** An event feed: someone did something to something, then. Arena draws every
 *  row — there is no per-item projection, because Angular has no binding for one. */
export function ActivityFeed({ items }) {
  if (items == null) throw new Error('ActivityFeed: `items` is required');
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={item.id != null ? item.id : i}
          style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
            padding: 'calc(var(--sp-1) * 3.5) 0',
            borderTop: i ? 'var(--bw) solid var(--color-base-300)' : 'none' }}>
          <span style={{ flex: 'none', width: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 2)',
            borderRadius: 'var(--r-pill)', background: TONES[item.tone] || TONES.accent }} />
          <span style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}>
            <b style={{ color: 'var(--bone)' }}>{item.actor}</b> {item.action}
            {item.target && ' '}
            {item.target && <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)' }}>{item.target}</span>}
          </span>
          {item.time && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{item.time}</span>}
        </li>
      ))}
    </ul>
  );
}
