import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaToastHostStyles } from './ArenaToastHost.variants';

const PLACEMENTS = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

