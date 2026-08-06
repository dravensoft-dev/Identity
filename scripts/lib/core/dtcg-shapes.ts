/* The shape `contracts/design/` holds on disk, so the scripts that walk it agree about it.
 * A DTCG file is a tree where a node is either a token, which carries `$value`, or a group,
 * which carries children and may carry a `$description`; every reader here tells them apart
 * by exactly that test, and `Object.entries()` over a `JSON.parse` hands back `unknown`, so
 * the test was a claim none of them stated. `filePath` is not DTCG: Style Dictionary stamps
 * it on, and the token generator reads it to decide which source file a token came from.
 * `childEntries()` skips the `$`-prefixed keys, which are the node's own metadata rather
 * than its children, and is the one place that rule is written down. */

export type DtcgToken = {
  $value: unknown;
  $type?: string;
  $description?: string;
  $extensions?: Record<string, any>;
  filePath?: string;
};

export type DtcgGroup = {
  $description?: string;
  [child: string]: unknown;
};

export type DtcgNode = DtcgToken & DtcgGroup;

export function childEntries(node): [string, DtcgNode][] {
  return Object.entries(node ?? {})
    .filter(([key, child]) => !key.startsWith('$') && child !== null && typeof child === 'object')
    .map(([key, child]) => [key, child as DtcgNode]);
}

export const isToken = (node: DtcgNode) => node.$value !== undefined;
