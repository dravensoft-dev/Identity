import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildPlaygrounds, codecFiles, codecTarget, renderCodec, CODEC_BANNER, CODEC_SOURCE, PLAYGROUND_LAYERS,
} from './generate-playgrounds.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

test('every layer with a playground gets the codec, and nothing else does', () => {
  assert.deepEqual(PLAYGROUND_LAYERS, ['react', 'angular']);
  assert.deepEqual(
    [...codecFiles().keys()],
    PLAYGROUND_LAYERS.map((layer) => codecTarget(layer)),
  );
});

test('the emitted copies are byte-identical, which is the whole reason they are emitted', () => {
  const bodies = new Set(codecFiles().values());
  assert.equal(bodies.size, 1,
    'two copies of decode() that drift render the same URL differently in each layer, and no gate would see it');
});

test('the copy names its generator and its source, so nobody edits the copy', () => {
  const body = [...codecFiles().values()][0];
  assert.ok(body.startsWith(CODEC_BANNER));
  assert.match(body, /generate-playgrounds\.mjs/);
  assert.match(body, /frameworks\/demos\/PlaygroundCodec\.ts/);
});

test('the copy carries the source verbatim below the banner', () => {
  const source = readFileSync(join(root, CODEC_SOURCE), 'utf8');
  assert.equal(renderCodec(source).slice(CODEC_BANNER.length), `\n${source}`);
});

test('the target carries the generated infix, or the copy would be read as hand-written', () => {
  for (const layer of PLAYGROUND_LAYERS) {
    assert.match(codecTarget(layer), /\.generated\.ts$/);
    assert.match(codecTarget(layer), new RegExp(`^frameworks/${layer}/playground/`));
  }
});

test('an emit of nothing is a failure rather than a clean pass', () => {
  const { files, problems } = buildPlaygrounds();
  assert.ok(files.size > 0);
  assert.deepEqual(problems, []);
});
