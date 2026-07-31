import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs, reportLines, hostPackage, main, USAGE } from './arena-theme.mjs';
import { PALETTE_KEYS } from './palette-keys.mjs';

test('the config path and the output path are both required', () => {
  assert.match(parseArgs([]).error, /no configuration file given/);
  assert.match(parseArgs(['a.json']).error, /no output path given/);
});

test('-o and --out and --out= all name the same thing', () => {
  assert.equal(parseArgs(['a.json', '-o', 'x.css']).out, 'x.css');
  assert.equal(parseArgs(['a.json', '--out', 'x.css']).out, 'x.css');
  assert.equal(parseArgs(['a.json', '--out=x.css']).out, 'x.css');
});

test('-o with nothing after it is an error rather than a silent undefined path', () => {
  assert.match(parseArgs(['a.json', '-o']).error, /-o needs a path/);
});

test('an unknown flag is refused by name', () => {
  assert.match(parseArgs(['a.json', '-o', 'x.css', '--minify']).error, /unknown flag: --minify/);
});

test('a second positional is an error, because one config makes one stylesheet', () => {
  assert.match(parseArgs(['a.json', 'b.json', '-o', 'x.css']).error, /unexpected extra argument: b\.json/);
});

test('both behaviour flags default off and read as themselves', () => {
  const plain = parseArgs(['a.json', '-o', 'x.css']);
  assert.equal(plain.strict, false);
  assert.equal(plain.importHeader, true);
  const flagged = parseArgs(['a.json', '-o', 'x.css', '--strict', '--no-import']);
  assert.equal(flagged.strict, true);
  assert.equal(flagged.importHeader, false);
});

test('--help asks for nothing else', () => {
  assert.equal(parseArgs(['--help']).help, true);
  assert.match(USAGE, /arena-theme <config\.json> -o <output\.css>/);
});

test('a report line names the palette it came from', () => {
  assert.deepEqual(
    reportLines([{ palette: 'ember', messages: ['text, x: 2.00:1'] }]),
    ['arena-theme: ember: text, x: 2.00:1'],
  );
});

function project(config) {
  const root = mkdtempSync(join(tmpdir(), 'arena-theme-'));
  writeFileSync(join(root, 'arena.config.json'), JSON.stringify(config));
  return root;
}

const colors = (overrides = {}) => {
  const out = {};
  for (const key of PALETTE_KEYS) out[key] = '#141010';
  return { ...out, ...overrides };
};

const readable = {
  palettes: [{ name: 'dark', default: true, polarity: 'dark',
    colors: colors({ 'base-content': '#f3ede5',
      'cat-1': '#3c7b0a', 'cat-2': '#3b63be', 'cat-3': '#0a924b', 'cat-4': '#6a59bc',
      'cat-5': '#00a3c0', 'cat-6': '#884da9', 'cat-7': '#00a99a', 'cat-8': '#984697' }) }],
  fonts: {
    display: { family: 'Archivo', src: 'https://example.com/a.woff2' },
    body: { family: 'Familjen Grotesk', src: 'https://example.com/b.woff2' },
    mono: { family: 'Spline Sans Mono', src: 'https://example.com/m.woff2' },
  },
};

function quietly(run) {
  const log = console.log, error = console.error;
  const said = [];
  console.log = (m) => said.push(m);
  console.error = (m) => said.push(m);
  try { return { code: run(), said }; } finally { console.log = log; console.error = error; }
}

test('a run writes the stylesheet and creates the directory leading to it', () => {
  const root = project(readable);
  const out = join(root, 'src', 'styles', 'arena.generated.css');
  const { code } = quietly(() => main([join(root, 'arena.config.json'), '-o', out], '@dravensoft/arena-react'));
  assert.equal(code, 0);
  assert.match(readFileSync(out, 'utf8'), /@import '@dravensoft\/arena-react\/arena\.css';/);
  rmSync(root, { recursive: true });
});

test('a configuration problem is fatal and writes nothing', () => {
  const broken = structuredClone(readable);
  delete broken.palettes[0].colors.primary;
  const root = project(broken);
  const out = join(root, 'arena.generated.css');
  const { code, said } = quietly(() => main([join(root, 'arena.config.json'), '-o', out]));
  assert.equal(code, 1);
  assert.ok(said.some((m) => m.includes('missing primary')));
  assert.equal(existsSync(out), false);
  rmSync(root, { recursive: true });
});

test('a config that is not JSON exits 2 rather than throwing', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-theme-'));
  writeFileSync(join(root, 'arena.config.json'), '{ not json');
  const { code, said } = quietly(() => main([join(root, 'arena.config.json'), '-o', join(root, 'a.css')]));
  assert.equal(code, 2);
  assert.ok(said.some((m) => m.includes('cannot read')));
  rmSync(root, { recursive: true });
});

test('a contrast report warns and still writes, and --strict makes it fatal', () => {
  const dim = structuredClone(readable);
  dim.palettes[0].colors['base-content'] = '#1a1a1a';
  const root = project(dim);
  const out = join(root, 'arena.generated.css');

  const warned = quietly(() => main([join(root, 'arena.config.json'), '-o', out]));
  assert.equal(warned.code, 0);
  assert.ok(warned.said.some((m) => m.includes('under the 4.5:1')));
  assert.ok(existsSync(out), 'the stylesheet is written: a consumer owns their brand');

  const strict = quietly(() => main([join(root, 'arena.config.json'), '-o', out, '--strict']));
  assert.equal(strict.code, 1);
  rmSync(root, { recursive: true });
});

test('the package name comes from the manifest above the bin directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-host-'));
  mkdirSync(join(root, 'bin'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: '@dravensoft/arena-angular' }));
  assert.equal(hostPackage(join(root, 'bin')), '@dravensoft/arena-angular');
  rmSync(root, { recursive: true });
});

test('a manifest that is not an Arena package names nothing, so the caller falls back', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-host-'));
  mkdirSync(join(root, 'bin'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'arena' }));
  assert.equal(hostPackage(join(root, 'bin')), null);
  assert.equal(hostPackage(join(root, 'nowhere')), null);
  rmSync(root, { recursive: true });
});
