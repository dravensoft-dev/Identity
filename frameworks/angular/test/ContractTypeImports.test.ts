/* Every declaration in `Api.generated.ts` is a type -- `export type` for the enums, `export
 * interface` for the predefined objects -- so none of them exists at runtime and a bare
 * `import { X }` there is a type-only import written without `type`. It compiles, nothing has
 * ever broken because of it, and no gate could see it: `check:api` compares members, `ngc`
 * elides the import either way. Three components carried the bare form for long enough that
 * the inconsistency was recorded as debt in a deleted plan and had to be rediscovered. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ANGULAR_COMPONENTS } from './Compliance';

const CONTRACT_IMPORT = /^import\s+(type\s+)?\{[^}]*\}\s+from\s+'[^']*Api\.generated';/gm;

function componentSources(): Array<{ path: string; source: string }> {
  const out: Array<{ path: string; source: string }> = [];
  for (const category of readdirSync(ANGULAR_COMPONENTS, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const categoryDir = join(ANGULAR_COMPONENTS, category.name);
    for (const dir of readdirSync(categoryDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const componentDir = join(categoryDir, dir.name);
      for (const file of readdirSync(componentDir)) {
        if (!file.endsWith('.ts')) continue;
        out.push({
          path: `${category.name}/${dir.name}/${file}`,
          source: readFileSync(join(componentDir, file), 'utf8'),
        });
      }
    }
  }
  return out;
}

export function valueImportProblems(files: Array<{ path: string; source: string }>): string[] {
  const problems: string[] = [];
  for (const { path, source } of files) {
    for (const line of source.match(CONTRACT_IMPORT) ?? []) {
      if (line.startsWith('import type')) continue;
      problems.push(
        `${path}: imports from Api.generated without \`type\`. Every declaration there is a type `
        + `and none exists at runtime, so this is a type-only import missing its keyword.\n    ${line}`,
      );
    }
  }
  return problems;
}

test('a contract type is imported with `import type`, never as a value', () => {
  const files = componentSources();
  assert.ok(files.length > 0, 'found no component sources, so this assertion checked nothing');
  const seen = files.filter((f) => CONTRACT_IMPORT.test(f.source));
  CONTRACT_IMPORT.lastIndex = 0;
  assert.ok(seen.length > 0, 'found no Api.generated import at all, so this assertion checked nothing');
  assert.deepEqual(valueImportProblems(files), []);
});

test('the rule is decided by the keyword and not by the file, so a bare import is caught wherever it sits', () => {
  assert.deepEqual(
    valueImportProblems([{ path: 'a/b/C.ts', source: "import type { Tone } from '../../../Api.generated';" }]),
    [],
  );
  const caught = valueImportProblems([
    { path: 'a/b/C.ts', source: "import { Tone } from '../../../Api.generated';" },
  ]);
  assert.equal(caught.length, 1);
  assert.match(caught[0], /a\/b\/C\.ts: imports from Api\.generated without/);
});

test('an import from anywhere else is none of this rule\'s business', () => {
  assert.deepEqual(
    valueImportProblems([{ path: 'a/b/C.ts', source: "import { signal } from '@angular/core';" }]),
    [],
  );
});
