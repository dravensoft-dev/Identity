import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUNDLE_DIR, PAGED, pageProblems } from './check-angular-demos.mjs';
import { readLayer } from './lib/layers.mjs';
import { repoRoot } from './lib/repo-root.mjs';

const TREE = { forms: ['button'] };

const PAGE =
  '<!doctype html><html><head><meta charset="utf-8"><title>arena-button</title></head>'
  + `<body><script type="module" src="../../../../../${BUNDLE_DIR}/Button.card.entry.js"></script></body></html>`;

const ENTRY =
  "import '@angular/compiler';\n"
  + "import { bootstrapApplication } from '@angular/platform-browser';\n"
  + 'bootstrapApplication(ButtonCard, { providers: [provideZonelessChangeDetection()] });\n';

function reader(files) {
  return (rel) => (rel in files ? files[rel] : null);
}

const GOOD = {
  'frameworks/angular/components/forms/button/Button.card.html': PAGE,
  'frameworks/angular/components/forms/button/Button.card.entry.ts': ENTRY,
};

test('a declared page with a bundled entry and a zoneless bootstrap passes', () => {
  const { problems, pages } = pageProblems(TREE, reader(GOOD), new Set(['Button']));
  assert.deepEqual(problems, []);
  assert.equal(pages, 1);
});

test('a declared component with no page fails, because PAGED promised a person could open one', () => {
  const { problems } = pageProblems(TREE, reader({}), new Set(['Button']));
  assert.ok(problems.some((p) => p.includes('Button.card.html: PAGED names Button')));
  assert.ok(problems.some((p) => p.includes('Button.card.entry.ts: PAGED names Button')));
});

test('a page that exists but is not declared fails, so the record cannot fall behind the tree', () => {
  const { problems } = pageProblems(TREE, reader(GOOD), new Set());
  assert.ok(problems.some((p) => p.includes('is not in PAGED')));
});

test('a PAGED entry naming no component directory is stale and fails', () => {
  const { problems } = pageProblems(TREE, reader(GOOD), new Set(['Button', 'Ghost']));
  assert.ok(problems.some((p) => p.includes('PAGED names "Ghost", which is no Angular component directory')));
});

test('an empty tree fails rather than passing vacuously', () => {
  const { problems } = pageProblems({}, reader({}), new Set());
  assert.ok(problems.some((p) => p.includes('found 0 Angular demo pages')));
});

test('a page pointing at another component\'s bundle fails', () => {
  const files = { ...GOOD };
  files['frameworks/angular/components/forms/button/Button.card.html'] =
    PAGE.replace('Button.card.entry.js', 'Tooltip.card.entry.js');
  const { problems } = pageProblems(TREE, reader(files), new Set(['Button']));
  assert.ok(problems.some((p) => p.includes("is not this component's bundled entry")));
});

test('an Angular page declaring @dsCard fails, because a blank page would pass check:cards', () => {
  const files = { ...GOOD };
  files['frameworks/angular/components/forms/button/Button.card.html'] =
    '<!-- @dsCard group="Angular" viewport="700x400" name="Button" subtitle="x" -->\n' + PAGE;
  const { problems } = pageProblems(TREE, reader(files), new Set(['Button']));
  assert.ok(problems.some((p) => p.includes('declares @dsCard')));
});

test('an entry that bootstraps with a zone fails, because the layer ships no zone.js', () => {
  const files = { ...GOOD };
  files['frameworks/angular/components/forms/button/Button.card.entry.ts'] =
    "import '@angular/compiler';\nbootstrapApplication(ButtonCard);\n";
  const { problems } = pageProblems(TREE, reader(files), new Set(['Button']));
  assert.ok(problems.some((p) => p.includes('does not provide zoneless change detection')));
});

test('an entry without @angular/compiler fails, because the library ships partially compiled', () => {
  const files = { ...GOOD };
  files['frameworks/angular/components/forms/button/Button.card.entry.ts'] =
    ENTRY.replace("import '@angular/compiler';\n", '');
  const { problems } = pageProblems(TREE, reader(files), new Set(['Button']));
  assert.ok(problems.some((p) => p.includes("does not import '@angular/compiler'")));
});

test('the shipped tree holds every page PAGED declares', () => {
  const read = (rel) => {
    const path = join(repoRoot, rel);
    return existsSync(path) ? readFileSync(path, 'utf8') : null;
  };
  const { problems, pages } = pageProblems(readLayer('angular'), read);
  assert.deepEqual(problems, []);
  assert.equal(pages, PAGED.size);
});
