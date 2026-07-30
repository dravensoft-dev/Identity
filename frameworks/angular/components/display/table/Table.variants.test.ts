import test from 'node:test';
import assert from 'node:assert/strict';
import { tableStyles } from './Table.variants';
import { tableRowStyles } from '../table-row/TableRow.variants';
import { tableCellStyles } from '../table-cell/TableCell.variants';

const SLOTS = [
  'root', 'grid', 'frame', 'table', 'headRow', 'th', 'row', 'rowFirst', 'rowInteractive',
  'td', 'tdMono', 'empty', 'cards', 'card', 'cardRow', 'cardLabel', 'cardValue', 'cardValueMono',
  'cardBlock',
] as const;

test('the three components read one recipe -- the family shares Table.manifest.json rather than mirroring it', () => {
  assert.equal(tableRowStyles().row(), tableStyles().row());
  assert.equal(tableCellStyles().td(), tableStyles().td());
});

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(tableStyles().root(), /(?:^|\s)block(?=\s|$)/);
});

test('the default is the WIDE shape -- a table renders as a grid before anything has been measured', () => {
  const wide = tableStyles();
  assert.equal(wide.root(), tableStyles({ narrow: false }).root());
  assert.match(wide.root(), /\brounded-lg\b/);
  assert.match(wide.root(), /\boverflow-hidden\b/);
  assert.match(wide.grid(), /(?:^|\s)table(?=\s|$)/);
});

test('below the breakpoint the frame goes away and the rows become a stack of cards', () => {
  const narrow = tableStyles({ narrow: true });
  assert.match(narrow.root(), /(?:^|\s)flex(?=\s|$)/);
  assert.match(narrow.root(), /\bflex-col\b/);
  assert.doesNotMatch(narrow.root(), /\brounded-lg\b/);
  assert.doesNotMatch(narrow.root(), /\boverflow-hidden\b/);
  assert.match(narrow.grid(), /(?:^|\s)contents(?=\s|$)/);
});

test('the two shapes are mutually exclusive -- neither leaks the other\'s box model', () => {
  const wide = tableStyles({ narrow: false });
  const narrow = tableStyles({ narrow: true });
  assert.doesNotMatch(wide.root(), /\bflex-col\b/);
  assert.doesNotMatch(narrow.grid(), /(?:^|\s)table(?=\s|$)/);
});

test('the row and cell slots carry the table display utilities they need as custom-element hosts', () => {
  assert.match(tableStyles().headRow(), /\btable-row\b/);
  assert.match(tableStyles().row(), /\btable-row\b/);
  assert.match(tableStyles().th(), /\btable-cell\b/);
  assert.match(tableStyles().td(), /\btable-cell\b/);
  assert.match(tableStyles().tdMono(), /\btable-cell\b/);
});

test('the first data row drops its top border, because the header cell already draws that hairline', () => {
  assert.match(tableStyles().th(), /\bborder-b-\[length:var\(--bw\)\]/);
  assert.match(tableStyles().row(), /\bborder-t-\[length:var\(--bw\)\]/);
  assert.match(tableStyles().rowFirst(), /\bborder-t-0\b/);
});

test('align moves the header and both cell faces together, and the default is left', () => {
  for (const [align, expected] of [['left', 'text-left'], ['center', 'text-center'], ['right', 'text-right']] as const) {
    const styles = tableStyles({ align });
    for (const slot of ['th', 'td', 'tdMono'] as const) {
      const classes = styles[slot]().split(/\s+/);
      assert.ok(classes.includes(expected), `align=${align}: ${slot} resolved to "${classes.join(' ')}"`);
      assert.equal(classes.filter((c) => c.startsWith('text-left') || c.startsWith('text-center')
        || c.startsWith('text-right')).length, 1, `align=${align}: ${slot} kept two alignments`);
    }
  }
  assert.equal(tableStyles().th(), tableStyles({ align: 'left' }).th());
});

test('the mono face is the gold ink -- an identifier column reads as data, not as prose', () => {
  assert.match(tableStyles().tdMono(), /\bfont-mono\b/);
  assert.match(tableStyles().tdMono(), /\btext-secondary\b/);
  assert.match(tableStyles().td(), /\bfont-body\b/);
});

test('a cell draws its focus ring from the focus tokens and suppresses the UA outline', () => {
  for (const slot of ['th', 'td', 'tdMono'] as const) {
    const classes = tableStyles()[slot]();
    assert.match(classes, /\boutline-none\b/, `${slot} keeps the UA outline as well as the ring`);
    assert.match(classes, /focus:shadow-\[inset_0_0_0_var\(--focus-width\)_var\(--focus-ring\)\]/,
      `${slot} draws no focus ring, so a keyboard user cannot see where the cursor is`);
  }
});

test('no slot paints a gradient, and depth comes from the surface scale and the hairline', () => {
  const styles = tableStyles();
  for (const slot of SLOTS) {
    assert.doesNotMatch(styles[slot](), /gradient/, `${slot} paints a gradient`);
  }
});

test('every slot resolves to a non-empty class string with no variant argument', () => {
  const styles = tableStyles();
  for (const slot of SLOTS) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});
