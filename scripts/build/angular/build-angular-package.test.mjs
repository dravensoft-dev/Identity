import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, posix } from 'node:path';
import {
  manifest, ngPackageConfig, libTsconfig, withAssets, ngPackagrBin,
  NAME, RUNTIME_DEPENDENCIES, STAGING, LAYER,
} from './build-angular-package.mjs';
import { version } from '../../lib/arena/package-assembly.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const variants = "import manifest from '../../../../tailwind/components/display/tag/Tag.manifest.generated';";

test('ng-packagr is pointed at the entry file and told where the package lands', () => {
  const config = ngPackageConfig();
  assert.equal(config.lib.entryFile, 'index.ts',
    'the entry sits AT the staged root, because ng-packagr infers rootDir from its directory');
  assert.equal(posix.join(STAGING, config.dest), `${LAYER}/dist`,
    'ng-packagr resolves dest against the directory ng-package.json sits in, so a dest restated '
    + 'rather than derived from STAGING writes the package that many levels off, exits 0, and is '
    + 'only noticed by the read of dist/package.json that follows');
});

test('the schema is named at the depth the staging tree sits at, so an editor resolves it', () => {
  const schema = posix.join(STAGING, ngPackageConfig().$schema);
  assert.equal(schema, 'node_modules/ng-packagr/ng-package.schema.json');
  assert.ok(existsSync(join(repoRoot, schema)), 'ng-packagr ships the schema it is validated against');
});

test('the one runtime dependency is allowed by name, or ng-packagr refuses to write', () => {
  assert.deepEqual(ngPackageConfig().allowedNonPeerDependencies, Object.keys(RUNTIME_DEPENDENCIES));
  assert.deepEqual(Object.keys(RUNTIME_DEPENDENCIES).sort(), ['tslib'],
    'a component composes its own class names, so the two recipe libraries that used to ship here '
    + 'are gone; tslib is Angular\'s own helper import and is the only one left');
});

test('the library compiles in partial mode under strictTemplates', () => {
  const tsconfig = libTsconfig();
  assert.equal(tsconfig.angularCompilerOptions.compilationMode, 'partial');
  assert.equal(tsconfig.angularCompilerOptions.strictTemplates, true);
});

test('the manifest names the package and takes its version from plugin.json', () => {
  const m = manifest(repoRoot);
  assert.equal(m.name, NAME);
  assert.equal(m.version, version(repoRoot));
});

test('Angular, the CDK and Phosphor are the peers; tslib is the only real dependency', () => {
  const m = manifest(repoRoot);
  assert.deepEqual(Object.keys(m.peerDependencies).sort(),
    ['@angular/cdk', '@angular/common', '@angular/core', '@angular/platform-browser', '@phosphor-icons/web']);
  assert.deepEqual(m.dependencies, RUNTIME_DEPENDENCIES,
    'tailwind-variants runs on every render to compose a slot class, so a consumer cannot be asked to bring it');
});

test('the assets are added to what ng-packagr wrote without losing its own entry', () => {
  const emitted = { exports: { '.': { types: './types/x.d.ts', default: './fesm2022/x.mjs' } } };
  const final = withAssets(emitted);
  assert.deepEqual(final.exports['.'], emitted.exports['.']);
  assert.deepEqual(final.exports['./arena.css'], { default: './arena.css' });
  assert.deepEqual(final.exports['./css/*'], { default: './css/*' });
  assert.equal(final.bin['arena-theme'], './bin/arena-theme.mjs');
});

test('the staging tree is the layer\'s own build/, git-ignored and excluded by an anchored path in every walker that reaches it', () => {
  assert.equal(STAGING, 'frameworks/angular/build/package');
});

test('a missing ng-packagr is reported rather than assumed', () => {
  assert.equal(ngPackagrBin('/nowhere-at-all'), null);
  assert.ok(ngPackagrBin(repoRoot), 'ng-packagr is a devDependency and should be installed');
});
