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

