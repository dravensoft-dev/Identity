/* What a published package is assembled from, so a workflow can ask whether anything it
 * carries has moved since the version now on the registry. The list is derived from what
 * the two assemblers actually read, and its suite holds it to that: a change to the CSS
 * chain or to where the CLI lives fails the test rather than quietly narrowing the guard.
 * The version file is deliberately absent. A release always moves it, and the guard is only
 * reached when the registry disagrees with it, so naming it here would put a changed file in
 * every diff and leave "nothing this package carries has moved" an answer nothing could
 * reach. A number is what a release moves; it is not a reason to republish a tree. */

import { isMainModule } from '../../utils/main-module.ts';
import { CSS_CHAIN } from '../../lib/arena/package-assembly.ts';

export const SHARED_INPUTS = {
  'contracts/design/': 'reset.css and colors.css lead the stylesheet every package carries',
  'contracts/design-generated/': 'the typography, spacing and effects the CSS chain copies',
  'scripts/generate/core/arena-to-prod/': 'the CLI each package ships as its bin',
  'scripts/lib/arena/package-assembly.ts': 'the exclusion list, the copy and the manifest template',
  'scripts/lib/arena/component-map.ts': 'the map of what a consumer writes to the sheet it costs, carried in both packages',
  'LICENSE': 'shipped verbatim in both packages',
};

export const PACKAGE_INPUTS: Record<string, Record<string, string>> = {
  react: {
    ...SHARED_INPUTS,
    'frameworks/react/': 'the layer itself',
    'frameworks/tailwind/': 'the manifest modules and the recipe runtime emitted into the layer, '
      + 'which are gitignored, so a manifest edit moves what the package ships and no tracked '
      + 'file under frameworks/react/ moves with it',
    'scripts/build/react/build-react-package.ts': 'the assembler',
    'scripts/build/react/build-react-barrel.ts': 'the entry point it compiles',
  },
  angular: {
    ...SHARED_INPUTS,
    'frameworks/angular/': 'the layer itself',
    'frameworks/tailwind/': 'the recipes the layer imports, staged into the package beside it',
    'scripts/build/angular/build-angular-package.ts': 'the assembler',
  },
};

export function pathspecs(layer: string) {
  const inputs = PACKAGE_INPUTS[layer];
  if (!inputs) throw new Error(`package-inputs: no package is assembled from a layer called "${layer}"`);
  return Object.keys(inputs).sort();
}

export function uncoveredChainEntries(inputs: Record<string, string> = SHARED_INPUTS, chain = CSS_CHAIN) {
  const prefixes = Object.keys(inputs);
  return chain
    .map((c) => c.from)
    .filter((from): from is string => from !== undefined)
    .filter((from) => !prefixes.some((p) => (p.endsWith('/') ? from.startsWith(p) : from === p)));
}

function main() {
  const [layer] = process.argv.slice(2);
  try {
    console.log(pathspecs(layer ?? '').join('\n'));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

if (isMainModule(import.meta.url)) main();
