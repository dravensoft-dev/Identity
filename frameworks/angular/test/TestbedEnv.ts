import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

export function ensureDom(): void {
  if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();
}

let claimed = false;

export function useTestEnvironment(): void {
  ensureDom();
  if (claimed) return;
  claimed = true;
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
}
