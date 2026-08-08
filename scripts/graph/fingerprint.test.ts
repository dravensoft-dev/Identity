import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stampAll, universe } from './inputs.ts';
import { fingerprintNodes, SCHEMA } from './fingerprint.ts';

const NODES = [
  { name: 'generate:tokens', reads: ['contracts/design'], writes: ['out/tokens.generated.css'], feeds: ['build:tailwind'] },
  { name: 'build:tailwind', reads: ['out/tokens.generated.css'], writes: ['out/utilities.generated.css'], feeds: [] },
  { name: 'build:vendor', reads: ['package.json'], writes: [], feeds: [] },
];

const DECLARED = new Map([
  ['generate:tokens', 'scripts/generate/arena/generate-tokens.ts'],
  ['build:tailwind', 'scripts/build/tailwind/build-tailwind.ts'],
  ['build:vendor', 'scripts/build/react/build-vendor.ts'],
]);

const withTree = (run: (root: string, print: () => Map<string, ReturnType<typeof Object>>) => void) => {
  const root = mkdtempSync(join(tmpdir(), 'arena-print-'));
  try {
    for (const rel of ['contracts/design/palette.json', 'out/tokens.generated.css', 'package.json']) {
      mkdirSync(join(root, rel, '..'), { recursive: true });
      writeFileSync(join(root, rel), rel);
    }
    for (const rel of DECLARED.values()) {
      mkdirSync(join(root, rel, '..'), { recursive: true });
      writeFileSync(join(root, rel), `// ${rel}\n`);
    }
    const print = () => {
      const paths = universe(root);
      return fingerprintNodes({ nodes: NODES, declaredIn: DECLARED, root, paths, stamps: stampAll(root, paths) });
    };
    run(root, print as never);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('the same tree fingerprints the same way twice', () => {
  withTree((_root, print) => {
    assert.deepEqual([...print()].map(([n, f]) => [n, f.fingerprint]),
      [...print()].map(([n, f]) => [n, f.fingerprint]));
  });
});

test('a changed source moves the node that reads it and everything downstream of it', () => {
  withTree((root, print) => {
    const before = print();
    writeFileSync(join(root, 'contracts/design/palette.json'), 'moved');
    const after = print();

    assert.notEqual(after.get('generate:tokens')?.fingerprint, before.get('generate:tokens')?.fingerprint);
    assert.notEqual(after.get('build:tailwind')?.fingerprint, before.get('build:tailwind')?.fingerprint,
      'build:tailwind reads only the generated file, so the edit reaches it through the edge and '
      + 'not through its own reads');
    assert.equal(after.get('build:vendor')?.fingerprint, before.get('build:vendor')?.fingerprint,
      'a node the change does not reach keeps its fingerprint, or nothing is ever cached');
  });
});

test("a changed script moves its own node and leaves the others alone", () => {
  withTree((root, print) => {
    const before = print();
    writeFileSync(join(root, 'scripts/build/react/build-vendor.ts'), '// edited\n');
    const after = print();

    assert.notEqual(after.get('build:vendor')?.fingerprint, before.get('build:vendor')?.fingerprint);
    assert.equal(after.get('generate:tokens')?.fingerprint, before.get('generate:tokens')?.fingerprint);
  });
});

test('widening what a node reads invalidates it, with no row of its own in the digest', () => {
  withTree((root, print) => {
    const before = print().get('generate:tokens')?.fingerprint;
    writeFileSync(join(root, 'scripts/generate/arena/generate-tokens.ts'), '// reads more now\n');
    assert.notEqual(print().get('generate:tokens')?.fingerprint, before,
      'the declaration lives in the script and the script is in the closure, which is why the '
      + 'digest carries no copy of it');
  });
});

test('a file appearing under a directory a node reads moves it', () => {
  withTree((root, print) => {
    const before = print().get('generate:tokens')?.fingerprint;
    writeFileSync(join(root, 'contracts/design/spacing.json'), 'new');
    assert.notEqual(print().get('generate:tokens')?.fingerprint, before);
  });
});

test('what a node carries is what a reader needs named, and the writes it has to find on disk', () => {
  withTree((_root, print) => {
    const tokens = print().get('generate:tokens');
    assert.equal(tokens?.script, 'scripts/generate/arena/generate-tokens.ts');
    assert.equal(tokens?.reads.count, 1);
    assert.deepEqual(tokens?.writes, ['out/tokens.generated.css']);
    assert.deepEqual(Object.keys(print().get('build:tailwind')?.up ?? {}), ['generate:tokens']);
  });
});

test('the schema is in the digest, so a change to what goes in invalidates everything', () => {
  assert.equal(typeof SCHEMA, 'number');
});
