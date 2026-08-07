import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaTableStyles } from './ArenaTable.variants';
import { arenaTableRowStyles } from '../arena-table-row/ArenaTableRow.variants';
import { arenaTableCellStyles } from '../arena-table-cell/ArenaTableCell.variants';

const SLOTS = [
  'root', 'grid', 'frame', 'table', 'headRow', 'th', 'row', 'rowFirst', 'rowInteractive',
  'td', 'tdMono', 'empty', 'cards', 'card', 'cardRow', 'cardLabel', 'cardValue', 'cardValueMono',
  'cardBlock',
] as const;

