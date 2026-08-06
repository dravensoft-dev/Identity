/* Resolving "components": "auto" against the map the package carries. A key is what the consumer
 * writes and a sheet is what dresses it, so a row, an item and a tab resolve to their parent's,
 * and a chart resolves to no sheet at all, which is an answer and not a miss. Then the closure,
 * because Arena draws components a consumer never names: a table brings a pagination and a select
 * with it, and a subset without them is a render with no border and no colour that nothing
 * reports. A key it cannot place is a line on stderr rather than a stop, since an element of the
 * consumer's own may wear the prefix. What it will not do is guess from a bare word: React is
 * read through the import naming the package and the JSX opening the tag, never the identifier
 * alone, because half this library is called ArenaCard, ArenaInput, ArenaTable or ArenaMenu in somebody else's code. */

export const AUTO = 'auto';

export const SELECTOR_LIKE = /<(arena-[a-z0-9-]+)[\s/>]/g;

export type ComponentMap = {
  match: string;
  draws: Record<string, string | null>;
  needs: Record<string, string[]>;
};

export function selectorKeys(map: ComponentMap, sources: string[]) {
  const drawn = new Set();
  const unplaced = new Set();
  for (const source of sources) {
    for (const m of source.matchAll(SELECTOR_LIKE)) {
      const selector = m[1] ?? '';
      (selector in map.draws ? drawn : unplaced).add(selector);
    }
  }
  return { drawn: [...drawn].sort(), unplaced: [...unplaced].sort() };
}

export const namedImports = (packageName: string) =>
  new RegExp(`import\\s*(?:type\\s*)?\\{([^}]*)\\}\\s*from\\s*['"]${packageName.replace('/', '\\/')}['"]`, 'g');

export const JSX_OPEN = /<([A-Z][A-Za-z0-9]*)[\s/>]/g;

export function symbolKeys(map: ComponentMap, sources: string[], packageName: string) {
  const written = new Set();
  const shape = namedImports(packageName);
  for (const source of sources) {
    for (const [, list] of source.matchAll(shape)) {
      for (const one of (list ?? '').split(',')) written.add((one.trim().split(/\s+as\s+/)[0] ?? '').trim());
    }
    for (const [, name] of source.matchAll(JSX_OPEN)) written.add(name);
  }
  return {
    drawn: ([...written] as string[]).filter((key) => key in map.draws).sort(),
    unplaced: [] as string[],
  };
}

export function resolve(map: ComponentMap, sources: string[], packageName: string) {
  const read = map.match === 'selector' ? selectorKeys(map, sources)
    : map.match === 'symbol' ? symbolKeys(map, sources, packageName)
      : null;
  if (!read) return null;

  const drawn = [...new Set((read.drawn as string[])
    .map((key) => map.draws[key])
    .filter((sheet): sheet is string => Boolean(sheet)))].sort();
  const pulled = [...new Set(drawn.flatMap((sheet) => map.needs[sheet] ?? []))]
    .filter((sheet) => !drawn.includes(sheet))
    .sort();

  return { components: [...drawn, ...pulled].sort(), keys: read.drawn, drawn, pulled, unplaced: read.unplaced };
}
