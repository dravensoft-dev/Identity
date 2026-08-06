/* The loss this module exists to prevent is a race -- the real tsc listing came back short in
 * 2 of 30 runs through a pipe -- and a suite that reproduced it at that rate would be a flake
 * pointing at the wrong file. So the child here is the same mechanism turned certain: it is a
 * FILE rather than a -e string, which flushes synchronously and would survive; its lines are
 * the width of the absolute paths tsc lists; and it hands them over in ONE write far larger
 * than a pipe holds, which is unflushed at process.exit() every time rather than sometimes.
 * Restore the pipe underneath and the first test fails on every run. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { childOutput } from './child-output.ts';

const LINES = 5000;
const PAD = 'x'.repeat(76);

function chatterbox(lines: number, code: number) {
  const dir = mkdtempSync(join(tmpdir(), 'arena-chatterbox-'));
  const file = join(dir, 'chatterbox.mjs');
  writeFileSync(file, [
    'const written = [];',
    `for (let i = 0; i < ${lines}; i++) written.push('out ' + i + ' ' + '${PAD}');`,
    "process.stdout.write(written.join('\\n') + '\\n');",
    "process.stderr.write('trouble\\n');",
    `process.exit(${code});`,
  ].join('\n'));
  return { dir, file };
}

function withChatterbox<T>(lines: number, code: number, read: (file: string) => T): T {
  const { dir, file } = chatterbox(lines, code);
  try {
    return read(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a child that writes line by line and then exits is read whole, which a pipe does not manage', () => {
  const r = withChatterbox(LINES, 0, (file) => childOutput(process.execPath, [file]));
  assert.equal(r.error, undefined);
  assert.equal(r.status, 0);
  const lines = r.stdout.split('\n').filter(Boolean);
  assert.equal(lines.length, LINES, `the child wrote ${LINES} line(s) and ${lines.length} came back`);
  assert.equal(lines[LINES - 1], `out ${LINES - 1} ${PAD}`,
    'the last line the child wrote is the one a truncated read loses');
});

test('the two streams stay apart, and output is stdout then stderr, which is what a caller printed before', () => {
  const r = withChatterbox(2, 0, (file) => childOutput(process.execPath, [file]));
  assert.equal(r.stdout, `out 0 ${PAD}\nout 1 ${PAD}\n`);
  assert.equal(r.stderr, 'trouble\n');
  assert.equal(r.output, `${r.stdout}${r.stderr}`);
});

test("the child's exit code is what the caller reads, so a gate still fails on it", () => {
  assert.equal(withChatterbox(1, 7, (file) => childOutput(process.execPath, [file])).status, 7);
});

test('a command that cannot be spawned reports an error, not a child that printed nothing', () => {
  const r = childOutput('arena-no-such-command', []);
  assert.ok(r.error, 'a missing command came back looking like a silent success');
  assert.equal(r.stdout, '');
});
