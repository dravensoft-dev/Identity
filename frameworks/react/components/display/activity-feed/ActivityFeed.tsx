import React from 'react';
import { focusableElements } from '../../../UseDialogModal.ts';

import type { ActivityItem } from '../../../Api.generated';

export type { ActivityItem };

export interface ActivityFeedProps {

  label: string;

  items: ActivityItem[];

  busy?: boolean;
}


const TONES = {
  neutral: 'var(--bone-dim)', accent: 'var(--crimson)', gold: 'var(--gold)',
  success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--info)',
};

export function ActivityFeed({ items, label, busy = false }: ActivityFeedProps) {
  if (!label?.trim()) throw new Error('ActivityFeed: `label` is required');
  if (items == null) throw new Error('ActivityFeed: `items` is required');

  const feedRef = React.useRef<HTMLUListElement | null>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const feed = feedRef.current;
    if (!feed) return;
    if (e.ctrlKey && (e.key === 'End' || e.key === 'Home')) {
      const after = e.key === 'End';
      const outside = focusableElements(feed.ownerDocument.body).filter((el) => !feed.contains(el));
      const position = after ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING;
      const reachable = outside.filter((el) => feed.compareDocumentPosition(el) & position);
      const target = after ? reachable[0] : reachable[reachable.length - 1];
      if (!target) return;
      e.preventDefault();
      target.focus();
      return;
    }
    if (e.key !== 'PageDown' && e.key !== 'PageUp') return;
    const articles = [...feed.querySelectorAll<HTMLElement>('[role="article"]')];
    if (articles.length === 0) return;
    const from = e.target instanceof Element ? e.target.closest<HTMLElement>('[role="article"]') : null;
    const here = from === null ? -1 : articles.indexOf(from);
    const there = here === -1
      ? (e.key === 'PageDown' ? 0 : articles.length - 1)
      : here + (e.key === 'PageDown' ? 1 : -1);
    if (there < 0 || there >= articles.length) return;
    e.preventDefault();
    articles[there]?.focus();
  };

  return (
    <ul ref={feedRef} role="feed" aria-label={label} aria-busy={busy ? 'true' : 'false'}
      onKeyDown={onKeyDown}
      style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={item.id != null ? item.id : i}
          role="article" tabIndex={0}
          aria-posinset={i + 1} aria-setsize={items.length}
          style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
            padding: 'calc(var(--sp-1) * 3.5) 0',
            borderTop: i ? 'var(--bw) solid var(--color-base-300)' : 'none' }}>
          <span aria-hidden="true" style={{ flex: 'none', width: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 2)',
            borderRadius: 'var(--r-pill)', background: (item.tone && TONES[item.tone]) || TONES.accent }} />
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
