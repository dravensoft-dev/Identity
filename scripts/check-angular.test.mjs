import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
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
    cpSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'), { recursive: true, dereference: false });
    const tag = join(dir, 'frameworks/angular/primitives/tag/tag.ts');
    writeFileSync(tag, readFileSync(tag, 'utf8').replace('styles().root()', 'styles().nosuchslot()'));
    const { status, output } = typecheck({ root: dir });
    assert.notEqual(status, 0);
    assert.match(output, /nosuchslot/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
