/* A node's fingerprint: what it reads, the script that declares it with everything under scripts/
 * that script imports, and the fingerprint of each node upstream. Composing upstreams is what
 * carries a contract edit down to a gate that reads only the generated file. The declaration needs
 * no row of its own, because it lives in the script and the script is in the closure: widening a
 * node's reads changes that file's hash and invalidates the node by itself. Every node is
 * fingerprinted whatever a run selects, since a downstream digest composes no other way. */

import { join } from 'node:path';
import { needsOf, topoOrder } from './graph.ts';
import type { GraphNode } from './graph.ts';
import { resolveSpecs } from './pathspecs.ts';
import { digestOf, sha256 } from './inputs.ts';
import type { Stamp } from './inputs.ts';
import { scriptClosure } from './script-closure.ts';

export const SCHEMA = 1;

export type Fingerprint = {
  fingerprint: string;
  script: string;
  reads: { digest: string; count: number };
  self: Record<string, string>;
  up: Record<string, string>;
  writes: string[];
};

const hashesOf = (paths: string[], stamps: Map<string, Stamp>) =>
  Object.fromEntries(paths.map((path) => [path, stamps.get(path)?.hash ?? '(gone)']));

export type Measure = {
  declaredIn: Map<string, string>;
  root: string;
  paths: string[];
  stamps: Map<string, Stamp>;
  needs: Map<string, string[]>;
  upstream: Map<string, string>;
};

export function fingerprintOne(node: GraphNode, m: Measure): Fingerprint {
  const reads = resolveSpecs(node.reads, m.paths);
  const script = m.declaredIn.get(node.name);
  const self = script ? scriptClosure(join(m.root, script), m.root) : [];
  const up = [...(m.needs.get(node.name) ?? [])].sort()
    .map((name) => [name, m.upstream.get(name) ?? '(unmeasured)']);

  return {
    script: script ?? '(uncollected)',
    fingerprint: sha256(JSON.stringify({
      v: SCHEMA,
      name: node.name,
      reads: reads.map((path) => [path, m.stamps.get(path)?.hash ?? '(gone)']),
      self: self.map((path) => [path, m.stamps.get(path)?.hash ?? '(gone)']),
      up,
    })),
    reads: { digest: digestOf(reads, m.stamps), count: reads.length },
    self: hashesOf(self, m.stamps),
    up: Object.fromEntries(up),
    writes: resolveSpecs(node.writes, m.paths),
  };
}

export function fingerprintNodes({ nodes, declaredIn, root, paths, stamps }: {
  nodes: GraphNode[];
  declaredIn: Map<string, string>;
  root: string;
  paths: string[];
  stamps: Map<string, Stamp>;
}) {
  const needs = needsOf(nodes);
  const upstream = new Map<string, string>();
  const out = new Map<string, Fingerprint>();

  for (const node of topoOrder(nodes)) {
    const measured = fingerprintOne(node, { declaredIn, root, paths, stamps, needs, upstream });
    out.set(node.name, measured);
    upstream.set(node.name, measured.fingerprint);
  }
  return out;
}
