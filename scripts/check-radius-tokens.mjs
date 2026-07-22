/* Fails when a Tailwind manifest under frameworks/tailwind/components/ carries
 * the bare `rounded-full` utility. Arena's whole radius vocabulary --
 * `rounded-xs`/`-sm`/`-md`/`-lg`/`-xl`/`-2xl`/`-pill` -- is wired in
 * frameworks/tailwind/theme.css to a `--r-*` token via `--radius-*`, and every
 * OTHER Tailwind default in a cleared namespace (`--radius-*: initial`) already
 * emits no rule at all, which is exactly what makes it visible to
 * check-tailwind.mjs's "every class emits a rule" assertion. `rounded-full` is
 * the one exception in this namespace: Tailwind v4's core plugin defines it as
 * a static `border-radius: calc(infinity * 1px)`, not sourced from any
 * `--radius-*` custom property, so clearing the namespace does not touch it --
 * it keeps emitting a rule, and check-tailwind.mjs has nothing to say about it,
 * because that gate only asks "does this class resolve", never "does it trace
 * to an Arena token". `check-tailwind-coverage.mjs` is the mirror image of
 * that same blind spot: it asserts every TOKEN reaches a utility, never that
 * every utility traces to a token.
 *
 * For any element small enough that Tailwind's `calc(infinity * 1px)` and
 * Arena's `--r-pill` (999px) both round it into a full circle or pill -- true
 * of every current use, all well under the ~1998px point where the two would
 * ever visibly differ -- `rounded-pill` is the token-backed equivalent and the
 * only one this gate accepts. It found six manifests carrying `rounded-full`
 * (Avatar, Button, Switch, Badge, Radio, Skeleton), two of them (Badge, Switch)
 * mixing both idioms in the same file; all six are corrected in the same
 * change that added this gate.
 *
 * SCOPE, deliberately narrow: this is not the general "does every Tailwind
 * class in a manifest trace to an Arena token" gate. That question is not
 * cheap to answer -- most of Tailwind's own defaults already produce no rule
 * at all once Arena's theme clears their namespace (`--spacing-*`, the color
 * scales, every OTHER radius step), so distinguishing a structural utility
 * that legitimately carries no token (`flex`, `items-center`, `inline-flex`)
 * from a bypassed one would mean enumerating Tailwind's entire core utility
 * set by hand. `rounded-full` is the one concrete, verified case in this
 * namespace where a rule keeps resolving despite carrying no Arena token
 * underneath, so this gate names that one class rather than guessing at
 * others that might share the shape.
 *
 * SCOPE: manifests only. It does not scan the `*.card.html` specimens or the
 * compiled `utilities.css`, so a specimen typing `rounded-full` onto an element
 * directly would pass unseen. That is narrower than the name suggests and is
 * stated here rather than left for a reader to discover -- nothing in the tree
 * does it today, and a specimen is supposed to take every class from
 * `classesFor()` anyway, but neither of those is this gate enforcing it.
 *
 *   bun scripts/check-radius-tokens.mjs   -> exit 0 clean, 1 otherwise
 *   node scripts/check-radius-tokens.mjs  -> same, runtime-portable
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { classStringsBySlot } from './check-manifest-states.mjs';

const COMPONENTS_DIR = join(repoRoot, 'frameworks/tailwind/components');

/** @param {string} classString @returns {boolean} true if it carries the
 *  bare `rounded-full` utility, word-bounded so `rounded-full-ish` (not a real
 *  class, but the same care check-manifest-states.mjs takes) would not
 *  false-positive. */
export function hasRoundedFull(classString) {
  return /(?<![\w-])rounded-full(?![\w-])/.test(classString);
}

/** @param {object} manifest a parsed manifest.json (must carry `component`)
 *  @returns {{component: string, slot: string}[]} every slot carrying
 *  `rounded-full`, across `slots` and every `variants` branch. */
export function evaluateManifest(manifest) {
  const findings = [];
  for (const [slot, classList] of classStringsBySlot(manifest))
    if (classList.some(hasRoundedFull))
      findings.push({ component: manifest.component, slot });
  return findings;
}

/** @returns {{component: string, slot: string}[]} */
export function collect() {
  const findings = [];
  const manifestFiles = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.manifest.json')).sort();
  for (const file of manifestFiles) {
    const manifest = JSON.parse(readFileSync(join(COMPONENTS_DIR, file), 'utf8'));
    findings.push(...evaluateManifest(manifest));
  }
  return findings;
}

function main() {
  const findings = collect();
  if (findings.length) {
    console.error(`check-radius-tokens: ${findings.length} rounded-full usage(s) -- derives from no Arena token\n`);
    for (const f of findings) console.error(`  ${f.component}:${f.slot} carries rounded-full -- use rounded-pill (--r-pill) instead`);
    process.exit(1);
  }
  console.log(`check-radius-tokens: 0 rounded-full usage(s) -- every radius traces to an Arena token`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
