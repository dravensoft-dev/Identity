/* Shared internals for Arena's Calendar. NOT a component — no quartet.
 *
 * Everything here is pure: dates and events in, numbers and strings out. No
 * React, no DOM. The calendar's weight was never the markup — it is (a) reading
 * wall-clock time in an arbitrary IANA zone and (b) laying out events that
 * overlap. Both are easier to reason about, and easier to be wrong about, away
 * from the JSX.
 *
 * Why Intl and not a date library: a copy-in kit has no package.json to add a
 * dependency to, and `Intl.DateTimeFormat.formatToParts` already answers the
 * only question we have — "what hour is this instant in that zone?" — against
 * the platform's own tz database. Same instinct that has the charts drawing
 * their own SVG instead of pulling in Chart.js.
 */

const warned = new Set();
function warnOnce(message) {
  if (warned.has(message) || typeof console === 'undefined') return;
  warned.add(message);
  console.warn('[arena] ' + message);
}

const formatters = new Map();
function partsFormatter(timeZone) {
  if (formatters.has(timeZone)) return formatters.get(timeZone);
  let f;
  try {
    /* h23 and not hour12:false — the latter still reports midnight as hour 24
       in some engines, which would place a 00:15 event off the bottom. */
    f = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    if (timeZone === 'UTC') throw new Error('[arena] calendar: Intl rejected UTC.');
    warnOnce(`calendar: unknown timeZone "${timeZone}" — falling back to UTC.`);
    f = partsFormatter('UTC');
  }
  formatters.set(timeZone, f);
  return f;
}

/** Wall-clock fields of an instant, as read in `timeZone`. Null when `iso` is
 *  not a date the platform can parse. */
export function zonedParts(iso, timeZone) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const out = {};
  for (const p of partsFormatter(timeZone).formatToParts(at)) {
    if (p.type !== 'literal') out[p.type] = p.value;
  }
  return { y: +out.year, m: +out.month, d: +out.day, hh: +out.hour, mm: +out.minute };
}

const p2 = (n) => String(n).padStart(2, '0');

export const isoDateOf = (p) => `${String(p.y).padStart(4, '0')}-${p2(p.m)}-${p2(p.d)}`;
export const minutesOf = (p) => p.hh * 60 + p.mm;
export const formatHM = (min) => `${p2(Math.floor(min / 60) % 24)}:${p2(Math.round(min) % 60)}`;

/** 'HH:MM' → minutes past midnight. `fallback` for anything unparseable, so a
 *  typo'd prop degrades to the default instead of collapsing the grid. */
export function parseHM(value, fallback) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''));
  if (!m) return fallback;
  const min = +m[1] * 60 + +m[2];
  return min >= 0 && min <= 24 * 60 ? min : fallback;
}

/* Calendar-date arithmetic runs at UTC: these are already zone-resolved dates,
 * and a local Date would let a DST jump move the day by one. */
function asUtcDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(isoDate, n) {
  const t = asUtcDate(isoDate);
  t.setUTCDate(t.getUTCDate() + n);
  return isoDateOf({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

/** 0 = Sunday … 6 = Saturday. */
export const weekdayOf = (isoDate) => asUtcDate(isoDate).getUTCDay();

export function startOfWeek(isoDate, weekStartsOn = 1) {
  return addDays(isoDate, -(((weekdayOf(isoDate) - weekStartsOn) % 7 + 7) % 7));
}

export const todayIso = (timeZone) => isoDateOf(zonedParts(new Date().toISOString(), timeZone));
export const nowMinutes = (timeZone) => minutesOf(zonedParts(new Date().toISOString(), timeZone));

/** Resolve every event to a day column and a wall-clock span in `timeZone`.
 *
 *  An event is placed on the day its start falls in and clamped to the end of
 *  that day. Arena's calendar has no all-day row and no multi-day bar, so an
 *  event running past midnight is shown to the end of the day it began on
 *  rather than silently dropped. Unparseable dates are skipped with a warning:
 *  one bad row should not blank the whole schedule. */
export function placeEvents(events, timeZone) {
  const out = [];
  for (const ev of events || []) {
    const s = zonedParts(ev?.start, timeZone);
    const e = zonedParts(ev?.end, timeZone);
    if (!s || !e) {
      warnOnce(`calendar: event "${ev?.id ?? '?'}" has an unparseable start/end — skipped.`);
      continue;
    }
    const dayIso = isoDateOf(s);
    const startMin = minutesOf(s);
    const endMin = isoDateOf(e) === dayIso ? minutesOf(e) : 24 * 60;
    out.push({ ev, dayIso, startMin, endMin: Math.max(endMin, startMin) });
  }
  return out;
}

/** Column assignment for one day's placements.
 *
 *  Events that overlap share the width of the day instead of covering each
 *  other: a schedule where one booking can hide another is worse than no
 *  calendar at all. A cluster is a run of events connected by overlap — if A
 *  overlaps B and B overlaps C, all three split the width even when A and C
 *  never touch, because anything else would leave the columns unaligned. Within
 *  a cluster each event takes the first column free at its start.
 *
 *  Returns each placement with `col` (its column) and `cols` (how many its
 *  cluster needs). */
export function layoutDay(placements) {
  const sorted = [...placements].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const out = [];
  let cluster = [];
  let colEnds = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const p of cluster) out.push({ ...p, cols: colEnds.length });
    cluster = [];
    colEnds = [];
    clusterEnd = -Infinity;
  };

  for (const p of sorted) {
    if (p.startMin >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= p.startMin);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(p.endMin);
    } else {
      colEnds[col] = p.endMin;
    }
    cluster.push({ ...p, col });
    clusterEnd = Math.max(clusterEnd, p.endMin);
  }
  flush();
  return out;
}

/** Where the grid starts when the consumer does not say: the hour the earliest
 *  visible event begins, floored, or 08:00 when there is nothing to show.
 *  Rendering empty small hours is the fastest way to make a schedule look
 *  broken — the user scrolls past six blank rows to reach the day. */
export function defaultDayStart(placements, fallback = 8 * 60) {
  if (!placements.length) return fallback;
  return Math.max(0, Math.floor(Math.min(...placements.map((p) => p.startMin)) / 60) * 60);
}

/* Dates reaching the formatters are already resolved to the target zone, so
 * they are formatted as UTC — re-applying the zone would shift them twice. */
const fmt = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
export const formatDate = (isoDate, opts) => fmt(opts).format(asUtcDate(isoDate));

/** "Fri, 17 Jul 2026" · "13 – 19 Jul 2026" · "29 Jun – 5 Jul 2026" · across a year
 *  boundary, both years. The month and year are printed once when the range
 *  shares them, twice only when it does not. */
export function rangeTitle(days) {
  if (!days.length) return '';
  const a = days[0];
  const b = days[days.length - 1];
  if (a === b) return formatDate(a, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const A = asUtcDate(a);
  const B = asUtcDate(b);
  const sameYear = A.getUTCFullYear() === B.getUTCFullYear();
  const sameMonth = sameYear && A.getUTCMonth() === B.getUTCMonth();
  const left = sameMonth ? formatDate(a, { day: 'numeric' })
    : sameYear ? formatDate(a, { day: 'numeric', month: 'short' })
      : formatDate(a, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${left} – ${formatDate(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
