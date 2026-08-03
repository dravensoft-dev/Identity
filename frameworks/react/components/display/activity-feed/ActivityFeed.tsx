import React from 'react';
import { focusableElements } from '../../../UseDialogModal.ts';

import type { ActivityItem } from '../../../Api.generated';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './ActivityFeed.classes.generated.ts';

export type { ActivityItem };

export interface ActivityFeedProps {

  /** Names the feed for assistive technology. Required, and guarded at runtime: nothing can derive it, and a feed is a landmark a reader navigates BY, so say what the events are about ("Deployment activity"), never "Activity feed". */
  label: string;

  /** The events, newest first by convention. Each row is drawn by Arena; there is no per-item projection. */
  items: readonly ActivityItem[];

  /** Whether a multi-step update to the feed is in progress, reflected as `aria-busy`. Set it while rows are being loaded or replaced and clear it once they settle, so a screen reader announces the settled feed rather than each intermediate state. It is an input rather than something Arena infers: only the host knows when its own loading has finished. */
  busy?: boolean;
}


const feedStyles = arenaStyles(manifest);
const TONES = Object.keys(manifest.variants.tone);
type Tone = NonNullable<ActivityItem['tone']>;
const toneOf = (tone: string | undefined): Tone | undefined =>
  (tone && TONES.includes(tone) ? tone as Tone : undefined);

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
      className={feedStyles({}).root()}>
      {items.map((item, i) => (
        <li key={item.id != null ? item.id : i}
          role="article" tabIndex={0}
          aria-posinset={i + 1} aria-setsize={items.length}
          className={feedStyles({ tone: toneOf(item.tone), divided: i > 0 }).item()}>
          <span aria-hidden="true" className={feedStyles({ tone: toneOf(item.tone) }).dot()} />
          <span className={feedStyles({}).text()}>
            <b className={feedStyles({}).actor()}>{item.actor}</b>
            {` ${item.action}${item.target ? ' ' : ''}`}
            {item.target && <span className={feedStyles({}).target()}>{item.target}</span>}
          </span>
          {item.time && <span className={feedStyles({}).time()}>{item.time}</span>}
        </li>
      ))}
    </ul>
  );
}
