import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaBottomNavStyles } from './ArenaBottomNav.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

