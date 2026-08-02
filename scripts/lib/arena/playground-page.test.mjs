import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playgroundPage, toggleDock, UP, PHOSPHOR_WEIGHTS } from './playground-page.mjs';

const page = (over = {}) => playgroundPage({
  component: 'Card', banner: '<!-- b -->\n', mount: '<div id="root"></div>', script: 'X.js', ...over,
});

test('every page links the shared chrome, which is what makes the frame the same in every layer', () => {
  const out = page();
  assert.match(out, new RegExp(`${UP}intro/styles\\.css`));
  assert.match(out, new RegExp(`${UP}intro/toggle\\.css`));
  assert.match(out, new RegExp(`${UP}intro/playground\\.css`));
  for (const weight of PHOSPHOR_WEIGHTS) assert.match(out, new RegExp(`src/${weight}/style\\.css`));
});

test('both toggles are static markup outside any framework, so a re-render cannot drop them', () => {
  const dock = toggleDock();
  assert.match(dock, /class="dtoggle themebtn"/);
  assert.match(dock, /id="density"/);
  assert.match(page(), /dtoggle-dock/);
});

test('the theme and density scripts load, or the URL stops reproducing the view', () => {
  assert.match(page(), new RegExp(`<script src="${UP}intro/theme\\.js">`));
  assert.match(page(), new RegExp(`<script src="${UP}intro/density\\.js">`));
});

test('a page declares no card, because its height moves with every knob', () => {
  assert.doesNotMatch(page(), /@dsCard/);
});

test('only the mount, the head and the script differ between two layers\' pages', () => {
  const a = page({ mount: '<div id="root"></div>', script: 'a.js', head: '<link rel="stylesheet" href="x.css">\n' });
  const b = page({ mount: '<demo-root></demo-root>', script: 'b.js' });
  const strip = (s) => s.replace(/<div id="root"><\/div>|<demo-root><\/demo-root>/, 'MOUNT')
    .replace(/src="[ab]\.js"/, 'src="SCRIPT"')
    .replace(/<link rel="stylesheet" href="x\.css">\n/, '');
  assert.equal(strip(a), strip(b));
});

test('the banner is the first line, and the depth to intro/ is the same for every component directory', () => {
  assert.ok(page().startsWith('<!-- b -->\n'));
  assert.equal(UP, '../../../../../');
});
