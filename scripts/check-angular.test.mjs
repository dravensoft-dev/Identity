import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { typecheck } from './check-angular.mjs';

test('the Angular layer as committed typechecks', () => {
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
