/* Assembles @dravensoft/arena-react into frameworks/react/dist/. The .jsx goes through
 * Bun.Transpiler, the same path build-demos.mjs uses, and each hand-written .d.ts is copied
 * rather than re-emitted, because those are the layer's real type contract. Every relative
 * .jsx specifier becomes .js, which is the one rewrite: inside the package there is no JSX
 * left to resolve. Nothing else here transforms anything. */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { arenaConfig } from '../../lib/core/arena-config.mjs';
import {
  collectFiles, reset, write, copy, writeCssChain, copyCli, baseManifest, report,
} from '../../lib/arena/package-assembly.mjs';

export const NAME = '@dravensoft/arena-react';
export const LAYER = 'frameworks/react';

export const ROOT_MODULES = [
  'Index.generated.js', 'Api.generated.d.ts', 'Tokens.generated.js',
  'DataVisuals.js', 'UseContainerWidth.js', 'UseDialogModal.js', 'Theme.js',
];

export function rewriteJsxSpecifiers(code) {
  return code.replace(/(from\s*['"])(\.[^'"]+?)\.jsx(['"])/g, '$1$2.js$3');
}

export function manifest(root = repoRoot) {
  return {
    name: NAME,
    description: 'Arena, the Dravensoft design system: React components styled entirely by design tokens.',
    keywords: ['design-system', 'react', 'ui', 'arena', 'dravensoft', 'design-tokens'],
    type: 'module',
    sideEffects: ['*.css'],
    ...baseManifest(root),
    exports: {
      '.': { types: './Index.generated.d.ts', import: './Index.generated.js' },
      './arena.css': './arena.css',
      './css/*': './css/*',
      './arena.config.example.json': './arena.config.example.json',
      './package.json': './package.json',
    },
    peerDependencies: {
      react: '^18 || ^19',
      'react-dom': '^18 || ^19',
      '@phosphor-icons/web': '^2.1.2',
    },
  };
}

export async function buildReactPackage(root = repoRoot) {
  const dir = join(root, LAYER, 'dist');
  const layer = join(root, LAYER);
  const written = [];

  reset(dir);

  const transpiler = new Bun.Transpiler({
    loader: 'jsx',
    tsconfig: JSON.stringify({ compilerOptions: { jsx: 'react' } }),
  });

  const sources = collectFiles(join(layer, 'components'), (p) => p.endsWith('.jsx'));
  if (sources.length === 0) throw new Error('build-react-package: found 0 component sources; the layer moved');

  for (const source of sources) {
    const rel = join('components', relative(join(layer, 'components'), source)).split(sep).join('/');
    written.push(write(dir, rel.replace(/\.jsx$/, '.js'), rewriteJsxSpecifiers(transpiler.transformSync(readFileSync(source, 'utf8')))));
  }
  const carried = collectFiles(join(layer, 'components'), (p) => p.endsWith('.d.ts') || p.endsWith('.js'));
  for (const file of carried) {
    written.push(copy(file, dir, join('components', relative(join(layer, 'components'), file)).split(sep).join('/')));
  }

  for (const name of ROOT_MODULES) {
    const from = join(layer, name);
    if (!existsSync(from)) throw new Error(`build-react-package: ${name} is missing from the layer root`);
    written.push(write(dir, name, rewriteJsxSpecifiers(readFileSync(from, 'utf8'))));
  }
  for (const name of ['Index.generated.d.ts', 'Theme.d.ts', 'DataVisuals.d.ts', 'UseContainerWidth.d.ts', 'UseDialogModal.d.ts']) {
    written.push(copy(join(layer, name), dir, name));
  }

  for (const to of writeCssChain(dir, NAME, [], root)) written.push(join(dir, to));
  written.push(join(dir, 'arena.css'));

  for (const rel of copyCli(dir, root)) written.push(join(dir, rel));

  written.push(write(dir, 'arena.config.example.json', `${JSON.stringify(arenaConfig(root), null, 2)}\n`));
  written.push(copy(join(layer, 'PACKAGE.md'), dir, 'README.md'));
  written.push(copy(join(root, 'LICENSE'), dir, 'LICENSE'));
  written.push(write(dir, 'package.json', `${JSON.stringify(manifest(root), null, 2)}\n`));

  return { dir, written, sources: sources.length, carried: carried.length };
}

async function main() {
  if (!process.versions.bun) {
    console.error('build-react-package: Bun.Transpiler is Bun-only, and this is not running under Bun');
    process.exit(2);
  }
  const { dir, written, sources, carried } = await buildReactPackage();
  console.log(report('build-react-package', dir, written));
  console.log(`build-react-package: ${sources} .jsx compiled, ${carried} .js and .d.ts carried across`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
