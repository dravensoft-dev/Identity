/* The shape `contracts/design/` holds on disk, so the scripts that walk it agree about it.
 * A DTCG file is a tree where a node is either a token, which carries `$value`, or a group,
 * which carries children and may carry a `$description`; every reader here tells them apart
 * by exactly that test, over an `Object.entries()` of a `JSON.parse` that hands back
 * `unknown`, so the test was a claim none of them stated. `filePath` and `name` are not
 * DTCG: Style Dictionary stamps them on. `childEntries()` skips the `$`-prefixed keys,
 * which are a node's own metadata rather than its children, and is the one place that
 * rule is written down. `$value` is `any` because `$type` decides its shape and DTCG
 * defines a family of them; the serializers branch on `$type` and own that knowledge. */

export type DtcgToken = {
  $value: any;
  $type?: string;
  $description?: string;
  $extensions?: Record<string, any>;
  filePath?: string;
  name?: string;
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
