import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from '../lib/arena/repo-root.ts';
import { relativeToRoot, traceFile } from './fs-trace.ts';
import { NOT_AN_INPUT, UNTRACEABLE, undeclaredReads } from './audit.ts';

const node = (over: Partial<{ reads: string[]; writes: string[] }> = {}) =>
  ({ name: 'check:x', reads: [], writes: [], feeds: [], ...over });

const withFiles = (files: Record<string, string>, run: (dir: string) => void) => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-audit-'));
  try {
    for (const [name, source] of Object.entries(files)) writeFileSync(join(dir, name), source);
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('an ESM import of node:fs before the patch is what defeats the tracer, and nothing else does', () => {
  const patch = [
    "import { createRequire } from 'node:module';",
    "const fs = createRequire(import.meta.url)('node:fs');",
    'const original = fs.existsSync;',
    'fs.existsSync = (...a) => { console.log("TRACED"); return original(...a); };',
    '',
  ].join('\n');

  withFiles({
    'clean.ts': patch,
    'poisoned.ts': `import { mkdirSync } from 'node:fs';\nvoid mkdirSync;\n${patch}`,
    'user.ts': ["import { existsSync } from 'node:fs';", "existsSync('.');", ''].join('\n'),
  }, (dir) => {
    const run = (preload: string) => spawnSync(
      process.execPath, ['--preload', join(dir, preload), join(dir, 'user.ts')],
      { encoding: 'utf8', cwd: repoRoot },
    ).stdout;

    assert.match(run('clean.ts'), /TRACED/,
      'the CommonJS object is the same object and its properties are writable, so a named import '
      + 'taken after the patch binds to the wrapper');
    assert.doesNotMatch(run('poisoned.ts'), /TRACED/,
      'the first ESM import of a builtin fixes the bindings every later importer gets, which is '
      + 'why nothing under scripts/graph/fs-trace.ts may import node:fs that way');
  });
});

test('a path outside the repository is not a read this graph can hold', () => {
  assert.equal(relativeToRoot('/repo', '/repo/contracts/design/colors.css'), 'contracts/design/colors.css');
  assert.equal(relativeToRoot('/repo', '/etc/hosts'), null);
  assert.equal(relativeToRoot('/repo', '/repo'), null);
  assert.equal(relativeToRoot('/repo', 42), null);
});

test('a trace file is named for its node, and a colon is not a filename', () => {
  assert.match(traceFile('/repo', 'check:tailwind-generated'), /check-tailwind-generated\.txt$/);
});

test('what a node declares is what excuses a read, in either direction', () => {
  const opened = ['contracts/design/colors.css', 'frameworks/react/Index.generated.ts'];
  assert.deepEqual(undeclaredReads(node({ reads: ['contracts/design/*.css'] }), opened, '/nowhere', () => true),
    ['frameworks/react/Index.generated.ts']);
  assert.deepEqual(undeclaredReads(
    node({ reads: ['contracts/design/*.css'], writes: ['frameworks/react/Index.generated.ts'] }),
    opened, '/nowhere', () => true,
  ), [], 'a gate comparing against its own output opens what it writes, and that is declared');
});

test('the trees a node never declares are not counted against it', () => {
  assert.deepEqual(
    undeclaredReads(node(), ['node_modules/react/index.js', '.git/HEAD', 'scripts/lib/arena/layers.ts'], '/nowhere', () => true),
    [],
    'scripts/ is in the closure rather than in reads, and the other two are outside the walk');
  assert.ok(NOT_AN_INPUT.length > 0);
});

test('a node that spawns is unaudited and never clean, so measuring nothing reads differently', () => {
  for (const [name, reason] of UNTRACEABLE) {
    assert.ok(reason.length > 20, `${name} is unauditable and the record does not say why`);
  }
  assert.ok(UNTRACEABLE.has('check:react-types'), 'the tracer cannot follow tsc into its own process');
});
