if (!globalThis.document) {
  throw new Error(
    'A .dom.test. suite needs its DOM installed before react-dom is evaluated. '
    + 'Run these suites as `bun test --preload ./frameworks/react/test/Preload.js '
    + '\'.dom.test.\'` (or `bun run test:react-dom`).',
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';

import { act } from 'react';

export { act };

interface Mounted {
  root: ReturnType<typeof createRoot>;
  container: HTMLDivElement;
}

const mounted: Mounted[] = [];

export function mount(element: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(element); });
  mounted.push({ root, container });
  return container;
}

export function cleanup(): void {
  for (let entry = mounted.pop(); entry !== undefined; entry = mounted.pop()) {
    const { root, container } = entry;
    act(() => { root.unmount(); });
    container.remove();
  }
  document.body.innerHTML = '';
}
