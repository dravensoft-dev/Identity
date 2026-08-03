import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingStyles } from './Onboarding.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

