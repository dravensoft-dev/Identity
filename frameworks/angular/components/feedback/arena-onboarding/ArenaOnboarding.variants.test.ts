import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaOnboardingStyles } from './ArenaOnboarding.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

