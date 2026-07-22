import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { typecheck } from './check-angular.mjs';

/* The explicit timeout matters as much here as on the test below, which has
 * carried one from the start. A full `ngc` run over the layer crossed
 * node:test's 5s default as the primitive count grew -- it measured ~5.1s at
 * 21 primitives -- and the failure that produces is deeply misleading: the
 * runner kills the compile, `typecheck()` reports the killed process's exit
 * status 1 with EMPTY output, and the assertion below prints "1 !== 0" with no
 * diagnostic at all, which reads exactly like a real type error nobody can
 * locate. The layer is still growing, so this is generous rather than snug. */
test('the Angular layer as committed typechecks', { timeout: 120_000 }, () => {
  const { status, output } = typecheck();
  assert.equal(status, 0, output);
});

test('a template referencing a member that does not exist fails', { timeout: 60_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-ng-'));
  try {
    cpSync(join(repoRoot, 'frameworks'), join(dir, 'frameworks'), { recursive: true });
    // node_modules is 225 MB / 17,675 files and read-only here — ngc resolves
    // @angular/* by walking up from the temp tree, and follows a symlink just
    // as well as a real directory, so there is nothing to gain from copying it.
    symlinkSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'));
    const tag = join(dir, 'frameworks/angular/primitives/tag/tag.ts');
    writeFileSync(tag, readFileSync(tag, 'utf8').replace('styles().root()', 'styles().nosuchslot()'));
    const { status, output } = typecheck({ root: dir });
    assert.notEqual(status, 0);
    assert.match(output, /nosuchslot/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
