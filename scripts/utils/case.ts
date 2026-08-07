/* The three name shapes this tree writes, from four implementations that had drifted.
 * `camel` and what `serialize-script.ts` called `scriptName` were the same function under two
 * names, and their character classes differed: one lifted a letter after a hyphen and the
 * other a letter or a digit, so `sp-4` became `sp4` in one and stayed `sp-4` in the other.
 * The wider class is the one kept, and it costs nothing at the narrower site: the pattern
 * feeding it captures `[a-z-]+`, a CSS property name, which cannot hold a digit at all.
 * `kebab` is the inverse of `pascal` and not of `camel`, since it lowercases the first
 * letter too. None of the three knows what it is naming; that is the caller's business. */

export function camel(name: string) {
  return name.trim().replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function pascal(name: string) {
  return name.replace(/(^|-)([a-z0-9])/g, (_, _sep: string, c: string) => c.toUpperCase());
}

export function kebab(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
