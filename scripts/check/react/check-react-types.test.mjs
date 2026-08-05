/* The flags asserted here are load-bearing rather than stylistic, and each one is
 * asserted with the failure it prevents: without verbatimModuleSyntax a demo page 404s
 * silently, and without erasableSyntaxOnly tsc and Bun.Transpiler may emit different code. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { PROJECTS } from './check-react-types.mjs';

const project = () => JSON.parse(readFileSync(join(repoRoot, PROJECTS[0].project), 'utf8'));

test('the gate names a project that exists', () => {
  for (const { project: path } of PROJECTS)
    assert.ok(existsSync(join(repoRoot, path)), `${path} does not exist`);
});

test('verbatimModuleSyntax is on, because Bun keeps a value-form import of a type', () => {
  assert.equal(project().compilerOptions.verbatimModuleSyntax, true,
    'without it a type imported in value form survives into the emit, and Api.generated has no '
    + 'runtime counterpart, so the demo page 404s with every gate green');
});

test('erasableSyntaxOnly is on, so tsc and Bun.Transpiler cannot disagree about runtime code', () => {
  assert.equal(project().compilerOptions.erasableSyntaxOnly, true,
    'it forbids enum, namespace and parameter properties -- the constructs that emit runtime code '
    + 'and where two transpilers may differ');
});

test('the project is strict, and checks what it indexes', () => {
  const options = project().compilerOptions;
  assert.equal(options.strict, true);
  assert.equal(options.noUncheckedIndexedAccess, true);
  assert.equal(options.noEmit, true, 'the checking project must never write output');
});

test('the project reaches the suites too, not the components alone', () => {
  const include = project().include ?? [];
  assert.ok(include.some((p) => p.endsWith('.tsx')), `no .tsx in include: ${JSON.stringify(include)}`);
  assert.ok(include.some((p) => p.endsWith('.ts')), `no .ts in include: ${JSON.stringify(include)}`);
  assert.ok((project().exclude ?? []).includes('./dist'),
    'dist holds a compiled copy of the layer, and checking it would double every declaration');
});
