/* Which Tailwind theme namespace each property in Theme.css belongs to. A namespace is
 * knowable two ways: Theme.css clears most of them with `--<ns>-*: initial`, and Tailwind
 * owns a fixed set it never has to clear, of which `spacing` is the one Theme.css leaves
 * open on purpose because `--spacing` is the base unit. The native set is read from
 * `tailwind-merge`'s `getDefaultConfig().theme`, which is a curated list and the only
 * correct source: deriving it from `tailwindcss/theme.css` by pattern splits `drop-shadow`
 * at the hyphen and loses `spacing` and `font-weight` entirely. That import is why
 * `tailwind-merge` stays a devDependency of this repository after it stops being a runtime
 * dependency of either published package. */

import { getDefaultConfig } from 'tailwind-merge';

export const NATIVE_THEME_NAMESPACES = new Set(Object.keys(getDefaultConfig().theme));

export function deriveNamespaces(decls, native = NATIVE_THEME_NAMESPACES) {
  const resetNamespaces = new Set();
  for (const [name, value] of decls) {
    const reset = /^([a-z][a-z0-9-]*)-\*$/.exec(name);
    if (reset && value.trim() === 'initial') resetNamespaces.add(reset[1]);
  }
  const knownNamespaces = [...new Set([...resetNamespaces, ...native])]
    .sort((a, b) => b.length - a.length);

  const namespaces = new Map();
  for (const [name] of decls) {
    if (/-\*$/.test(name)) continue;
    const ns = knownNamespaces.find((candidate) => name.startsWith(`${candidate}-`));
    if (!ns) continue;
    if (!namespaces.has(ns)) namespaces.set(ns, []);
    namespaces.get(ns).push(name.slice(ns.length + 1));
  }
  return namespaces;
}

export function namespacedPropertyCandidates(decls) {
  const candidates = [];
  for (const [name] of decls) {
    if (/-\*$/.test(name)) continue;
    if (/^[a-z][a-z0-9]*-[a-z0-9.-]+$/.test(name)) candidates.push(name);
  }
  return candidates;
}

export function attributedNames(namespaces) {
  const names = new Set();
  for (const [ns, keys] of namespaces) for (const key of keys) names.add(`${ns}-${key}`);
  return names;
}
