import { fileURLToPath } from 'node:url';
import { compileLayer, manifestClasses, escapeClass } from '../../lib/tailwind/tailwind-compile.mjs';
import { arenaTokens } from '../../lib/core/arena-tokens.mjs';

export function themeKeys(css) {
  const out = new Map();
  const m = css.match(/@layer theme\s*\{\s*:root[^{]*\{([\s\S]*?)\n\s*\}/);
  if (!m) return out;
  for (const line of m[1].split(';')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const name = line.slice(0, i).trim();
    if (!name.startsWith('--')) continue;
    out.set(name.slice(2), line.slice(i + 1).trim());
  }
  return out;
}

export function checkCompiled(css, manifests, tokens) {
  const errs = [];

  if (manifests.size === 0)
    errs.push('found 0 manifests — an empty result set is a failure, not a clean pass; check the discovery path');

  for (const [file, manifest] of manifests)
    for (const cls of manifestClasses(manifest))
      if (!css.includes(`.${escapeClass(cls)}`))
        errs.push(`${file}: \`${cls}\` produced no rule — the utility does not exist`);

  for (const [key, value] of themeKeys(css)) {
    if (key.startsWith('tw-') || key.startsWith('default-')) continue;
    const ref = value.match(/^var\(--([a-z0-9-]+)\)$/);
    if (!ref) { errs.push(`--${key}: not a var() into an Arena token — emits \`${value}\``); continue; }
    if (!tokens.has(ref[1])) errs.push(`--${key}: --${ref[1]} is no such Arena token`);
  }

  if (css.includes('0.25rem'))
    errs.push("the compiled layer contains `0.25rem` — Tailwind's default --spacing is reachable; set `--spacing: var(--sp-1)`");

  return errs;
}

function main() {
  const { css, manifests } = compileLayer();
  const errs = checkCompiled(css, manifests, arenaTokens());
  if (errs.length) {
    console.error(`check-tailwind: ${errs.length} violation(s) in the compiled Tailwind layer\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const classes = [...manifests.values()].reduce((n, m) => n + manifestClasses(m).length, 0);
  console.log(`check-tailwind: ${manifests.size} manifest(s), ${classes} class(es), ${themeKeys(css).size} theme key(s) — all resolve to Arena tokens`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
