/* Which framework layers a diff reaches. The map is here rather than in YAML because a
 * routing rule nothing tests is a rule that reports green over a tree it never opened,
 * and because one of its entries is not obvious: a Tailwind edit routes to Angular too,
 * since every .variants.ts imports a generated manifest and ngc fails without it. */

import { fileURLToPath } from 'node:url';
import { LAYERS } from '../../lib/arena/layers.mjs';

export const SHARED = {
  'contracts/': 'the three contract levels every layer answers to',
  'scripts/': 'the tooling that builds, generates and gates every layer',
  '.github/': 'the workflows deciding what runs at all',
  'package.json': 'the toolchain and every script a job invokes',
  'bun.lock': 'the resolved dependency tree each layer compiles against',
};

export const LAYER_INPUTS = {
  react: { 'frameworks/react/': 'its own layer' },
  angular: {
    'frameworks/angular/': 'its own layer',
    'frameworks/tailwind/': 'every .variants.ts imports a generated manifest, so ngc fails without it',
  },
  tailwind: { 'frameworks/tailwind/': 'its own layer' },
};

function reaches(prefix, path) {
  return prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix;
}

export function layersChanged(paths) {
  const changed = {};
  const shared = paths.some((p) => Object.keys(SHARED).some((prefix) => reaches(prefix, p)));
  for (const layer of Object.keys(LAYER_INPUTS)) {
    changed[layer] = shared
      || paths.some((p) => Object.keys(LAYER_INPUTS[layer]).some((prefix) => reaches(prefix, p)));
  }
  return changed;
}

export function renderOutputs(changed) {
  return Object.keys(LAYER_INPUTS)
    .sort()
    .map((layer) => `${layer}=${changed[layer] ? 'true' : 'false'}`)
    .join('\n');
}

export function unroutedLayers(inputs = LAYER_INPUTS, layers = LAYERS) {
  return layers.filter((layer) => !(layer in inputs));
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const paths = String(Buffer.concat(chunks))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const unrouted = unroutedLayers();
  if (unrouted.length > 0) {
    console.error(`changed-layers: ${unrouted.join(', ')} has no entry in LAYER_INPUTS, so a change to it would route nowhere`);
    process.exit(1);
  }

  const changed = layersChanged(paths);
  console.log(renderOutputs(changed));
  console.error(`changed-layers: ${paths.length} path(s) -> ${renderOutputs(changed).replace(/\n/g, ' ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
