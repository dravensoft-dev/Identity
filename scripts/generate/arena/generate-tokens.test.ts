/* RESOLVES_AGAINST is what lets a DTCG reference cross a source file, and it is opt-in
 * per source rather than a merge of all eleven: two palettes declare the same token paths,
 * so merging them would let one theme's description leak onto the other's value. That
 * makes every entry a claim, and a stale one is silent -- these tests are the check. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FILES, RESOLVES_AGAINST } from './generate-tokens.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';

const DESIGN = join(repoRoot, 'contracts/design');
const SOURCES = [...new Set(FILES.flatMap((f) => f.blocks.map((b) => b.source)))];
const REFERENCE = /"\$value"\s*:\s*"\{([^}]+)\}"/g;

function referencedGroups(source: string) {
  const text = readFileSync(join(DESIGN, source), 'utf8');
  return [...text.matchAll(REFERENCE)].map((m) => m[1]?.split('.')[0]);
}

function topLevelGroups(source: string) {
  return Object.keys(JSON.parse(readFileSync(join(DESIGN, source), 'utf8')));
}

test('every key and value in RESOLVES_AGAINST is a source this build actually reads', () => {
  for (const [source, against] of Object.entries(RESOLVES_AGAINST)) {
    assert.ok(SOURCES.includes(source), `RESOLVES_AGAINST names "${source}", which no block reads -- stale entry`);
    for (const other of against) {
      assert.ok(existsSync(join(DESIGN, other)), `"${source}" resolves against "${other}", which does not exist`);
      assert.notEqual(source, other, `"${source}" cannot resolve against itself`);
    }
  }
});

test('a source that references another file names it, and one that references nothing is absent', () => {
  for (const source of SOURCES) {
    const groups = new Set(referencedGroups(source));
    const own = new Set(topLevelGroups(source));
    const foreign = [...groups].filter((g): g is string => g !== undefined && !own.has(g));
    const declared: string[] = (RESOLVES_AGAINST as Record<string, string[]>)[source] ?? [];

    if (foreign.length === 0) {
      assert.equal(declared.length, 0,
        `"${source}" references nothing outside itself, so its RESOLVES_AGAINST entry is stale`);
      continue;
    }
    for (const group of foreign) {
      const holder = declared.find((other: string) => topLevelGroups(other).includes(group ?? ''));
      assert.ok(holder,
        `"${source}" references {${group}.…}, which lives in no file it resolves against -- `
        + 'the reference would silently emit unresolved');
    }
  }
});

test('a declared resolution source shares no top-level group with the file that reads it', () => {
  for (const [source, against] of Object.entries(RESOLVES_AGAINST)) {
    const own = new Set(topLevelGroups(source));
    for (const other of against) {
      const collision = topLevelGroups(other).filter((g) => own.has(g));
      assert.deepEqual(collision, [],
        `"${source}" and "${other}" both declare ${collision.join(', ')}. A shared group merges, and a merge `
        + "fills one file's missing descriptions from the other -- which is the defect the opt-in map avoids.");
    }
  }
});
