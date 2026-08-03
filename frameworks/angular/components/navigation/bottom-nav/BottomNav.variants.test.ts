import test from 'node:test';
import assert from 'node:assert/strict';
import { bottomNavStyles } from './BottomNav.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

