import { calendarActionsBelowMinH, calendarTimeMinH, calendarTimeMinW } from '../../../Tokens.generated.js';

export function showsTime(chipHeight, slotWidth) {
  if (chipHeight < calendarTimeMinH) return false;
  return slotWidth === null || slotWidth >= calendarTimeMinW;
}

export function stacksActions(chipHeight, slotWidth) {
  return chipHeight >= calendarActionsBelowMinH && !showsTime(chipHeight, slotWidth);
}

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

export function parseHM(value, fallback) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''));
  if (!m) return fallback;
  const min = +m[1] * 60 + +m[2];
  return min >= 0 && min <= 24 * 60 ? min : fallback;
}

function asUtcDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(isoDate, n) {
  const t = asUtcDate(isoDate);
  t.setUTCDate(t.getUTCDate() + n);
  return isoDateOf({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

export const weekdayOf = (isoDate) => asUtcDate(isoDate).getUTCDay();

export function startOfWeek(isoDate, weekStartsOn = 1) {
  return addDays(isoDate, -(((weekdayOf(isoDate) - weekStartsOn) % 7 + 7) % 7));
}

export const todayIso = (timeZone) => isoDateOf(zonedParts(new Date().toISOString(), timeZone));
export const nowMinutes = (timeZone) => minutesOf(zonedParts(new Date().toISOString(), timeZone));

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

export function defaultDayStart(placements, fallback = 8 * 60) {
  if (!placements.length) return fallback;
  return Math.max(0, Math.floor(Math.min(...placements.map((p) => p.startMin)) / 60) * 60);
}

const dateFormatters = new Map();
function dateFormatter(opts) {
  const key = JSON.stringify(opts ?? {});
  let f = dateFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
    dateFormatters.set(key, f);
  }
  return f;
}

export const formatDate = (isoDate, opts) => dateFormatter(opts).format(asUtcDate(isoDate));

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
