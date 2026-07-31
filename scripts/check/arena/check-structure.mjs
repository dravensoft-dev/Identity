import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from '../../lib/repo-root.mjs';
import { LAYERS, kebab, readLayer } from '../../lib/layers.mjs';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateStructure({ categories, layers, complete = false }) {
  const problems = [];

  const firstCategoryOf = new Map();
  for (const [category, names] of Object.entries(categories))
    for (const name of names) {
      if (firstCategoryOf.has(name)) {
        problems.push(`${name} is declared in both ${firstCategoryOf.get(name)} and ${category} in frameworks/Components.json`);
        continue;
      }
      firstCategoryOf.set(name, category);
    }

  const declared = new Map();
  for (const [name, category] of firstCategoryOf) declared.set(kebab(name), { name, category });

  const seen = new Set();
  for (const [layer, tree] of Object.entries(layers))
    for (const [category, dirs] of Object.entries(tree))
      for (const dir of dirs) {
        if (!KEBAB.test(dir)) {
          problems.push(`${layer}: components/${category}/${dir} is not a kebab-case directory name`);
          continue;
        }
        const d = declared.get(dir);
        if (!d) {
          problems.push(`${layer}: components/${category}/${dir} is a component directory frameworks/Components.json does not name`);
          continue;
        }
        seen.add(d.name);
        if (d.category !== category)
          problems.push(`${layer}: ${d.name} is in components/${category}/ but frameworks/Components.json assigns it to ${d.category}`);
      }

  if (complete)
    for (const { name } of declared.values())
      if (!seen.has(name))
        problems.push(`${name} is declared in frameworks/Components.json but exists in no layer`);

  return problems;
}

export function zeroLayerProblems(layers) {
  const problems = [];
  for (const [layer, tree] of Object.entries(layers)) {
    const count = Object.values(tree).reduce((n, dirs) => n + dirs.length, 0);
    if (count === 0)
      problems.push(`found 0 component directories in frameworks/${layer}/components — an empty result set is a failure, not a clean pass; check the discovery path`);
  }
  return problems;
}

function main() {
  const categories = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));
  const layers = Object.fromEntries(LAYERS.map((l) => [l, readLayer(l)]));

  const complete = true;
  const problems = [
    ...zeroLayerProblems(layers),
    ...validateStructure({ categories, layers, complete }),
  ];

  if (problems.length) {
    console.error('check:structure — a layer does not match frameworks/Components.json:\n');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
  }
  const total = Object.values(categories).reduce((n, names) => n + names.length, 0);
  const checked = Object.values(layers).reduce(
    (n, tree) => n + Object.values(tree).reduce((m, dirs) => m + dirs.length, 0), 0,
  );

  const rule4 = complete ? ', every declared component present in at least one layer' : '';
  console.log(`check:structure OK — components/ under ${LAYERS.join(', ')} match frameworks/Components.json (${checked} checked of ${total} declared${rule4}).`);
  console.log('  (A green run says the layers agree with one declaration, never that the categories are well chosen.)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
