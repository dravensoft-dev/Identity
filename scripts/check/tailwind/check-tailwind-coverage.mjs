import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { arenaTokens } from '../../lib/arena-tokens.mjs';
import { repoRoot } from '../../lib/repo-root.mjs';

export const EXCLUDED = new Map([
  ['sp-0', 'p-0 compiles to a literal 0px in v4 regardless of the theme'],
  ['bp-sm', 'read by JS through getComputedStyle, never a media query'],
  ['bp-md', 'read by JS through getComputedStyle, never a media query'],
  ['bp-lg', 'read by JS through getComputedStyle, never a media query'],
  ['dur-fast', 'v4 has no duration namespace; wired as --default-transition-duration'],
  ['dur-mid', 'v4 has no duration namespace; reached as duration-[var(--dur-mid)]'],
  ['dur-slow', 'v4 has no duration namespace; no consumer today, available as duration-[var(--dur-slow)]'],
  ['loop-spin', 'v4 has no duration namespace; reached as duration-[var(--loop-spin)]'],
  ['loop-sweep', 'v4 has no duration namespace; reached as duration-[var(--loop-sweep)]'],
  ['loop-shimmer', 'v4 has no duration namespace; reached as duration-[var(--loop-shimmer)]'],
  ['loop-brand', 'v4 has no duration namespace; reached as duration-[var(--loop-brand)]'],
  ['loop-reduced', 'v4 has no duration namespace; the reduced-motion step, set inside a media query rather than by a utility'],
  ['loop-brand-reduced', 'v4 has no duration namespace; the reduced-motion step, set inside a media query rather than by a utility'],
  ['bw', 'v4 has no border-width namespace; reached as border-[length:var(--bw)]'],
  ['bw-strong', 'v4 has no border-width namespace; no consumer today, available as border-[length:var(--bw-strong)]'],
  ['focus-width', 'no namespace — the focus ring is composed, not a single utility'],
  ['focus-offset', 'no namespace — the focus ring is composed, not a single utility'],
  ['chart-height', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-top', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-right', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-bottom', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-left', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-bar-radius', 'script-readable: passed to barPath(), which builds an SVG path string'],
  ['chart-bar-gap', 'script-readable: subtracted from the per-bar step width'],
  ['chart-point-r', 'script-readable: an SVG circle r attribute computed per point'],
  ['chart-point-r-hover', 'script-readable: an SVG circle r attribute computed per point'],
  ['chart-legend-min', 'script-readable: a clamp bound compared against a measured width'],
  ['chart-legend-max', 'script-readable: a clamp bound compared against a measured width'],
  ['chart-legend-gap', 'script-readable: subtracted from a measured width to size the plot'],
  ['calendar-hour-h', 'script-readable in both layers: JS projects a minute-of-day onto a pixel offset from it, and the chip and the hour cell it sits over must agree to the pixel, which only one shared number gives them'],
  ['calendar-gutter-w', 'script-readable: JS subtracts it from the measured container width to get the grid\'s width. Also rendered directly as var(--calendar-gutter-w) in both layers — React inline, Angular through the shared manifest\'s w-[var(--calendar-gutter-w)] and pl-[var(--calendar-gutter-w)] — for the hour-label column\'s width and the header strip\'s padding-left, never through the @theme spacing scale this gate checks'],
  ['calendar-time-min-h', 'script-readable in both layers: compared in JS against a chip\'s projected pixel height to decide whether its time label fits vertically. Never rendered as a length'],
  ['calendar-time-min-w', 'script-readable in both layers: compared in JS against a chip\'s column share to decide whether its time label fits horizontally. Never rendered as a length'],
  ['calendar-actions-below-min-h', 'script-readable in both layers: compared in JS against a chip\'s projected pixel height to decide whether its kebab can sit below its title instead of beside it. Never rendered as a length'],
  ['onboarding-width', 'script-readable: compared against window.innerWidth by Math.min/Math.max. Rendered directly as var(--onboarding-width) in both layers — React inline, Angular via the shared manifest\'s w-[var(--onboarding-width)] — never through the @theme spacing scale this gate checks'],
  ['delay-open', 'script-readable: a setTimeout argument for pointer intent, never a utility'],
  ['delay-close', 'script-readable: a setTimeout argument for pointer intent, never a utility'],
  ['dismiss-default', 'script-readable: the host runs the toast clock in JS, never a utility'],
  ['dismiss-actionable', 'script-readable: the host runs the toast clock in JS, never a utility'],
  ['limit-pagination-siblings', 'script-readable: an array bound, and the elision threshold derives from it in JS'],
]);

export function presetTokens(css) {
  const out = new Set();
  const m = css.match(/@theme\s*\{([\s\S]*)\}/);
  if (!m) return out;

  const body = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of body.split(';')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();

    if (!key.startsWith('--') || key.startsWith('--default-')) continue;
    const ref = line.slice(i + 1).match(/^\s*var\(--([a-z0-9-]+)\)\s*$/);
    if (ref) out.add(ref[1]);
  }
  return out;
}

export function checkCoverage(tokens, exposed, excluded) {
  const errs = [];
  for (const t of [...tokens].sort()) {
    const isExposed = exposed.has(t);
    const isExcluded = excluded.has(t);
    if (isExposed && isExcluded) errs.push(`--${t} is both exposed and excluded — drop the exclusion`);
    else if (!isExposed && !isExcluded)
      errs.push(`--${t} reaches no Tailwind utility — expose it in frameworks/tailwind/Theme.css or add it to EXCLUDED with a reason`);
  }
  for (const t of [...excluded.keys()].sort())
    if (!tokens.has(t)) errs.push(`--${t} is excluded but no such token exists — drop the exclusion`);
  for (const t of [...exposed].sort())
    if (!tokens.has(t)) errs.push(`the preset references --${t} — no such token in contracts/design-generated/`);
  return errs;
}

function main() {
  const tokens = arenaTokens();
  const preset = readFileSync(join(repoRoot, 'frameworks/tailwind/Theme.css'), 'utf8');
  const exposed = presetTokens(preset);
  const errs = checkCoverage(tokens, exposed, EXCLUDED);
  if (errs.length) {
    console.error(`check-tailwind-coverage: ${errs.length} token(s) undeclared\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-tailwind-coverage: ${tokens.size} token(s) — ${exposed.size} exposed, ${EXCLUDED.size} excluded on the record`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
