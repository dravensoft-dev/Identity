if (!globalThis.document) {
  throw new Error(
    'A .dom.test.jsx suite needs its DOM installed before react-dom is evaluated. '
    + 'Run these suites as `bun test --preload ./frameworks/react/test/Preload.js '
    + '\'.dom.test.jsx\'` (or `bun run test:react-dom`).',
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';

import { act } from 'react';

export { act };

const mounted = [];

export function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(element); });
  mounted.push({ root, container });
  return container;
}

export function cleanup() {
  while (mounted.length) {
    const { root, container } = mounted.pop();
    act(() => { root.unmount(); });
    container.remove();
  }
  document.body.innerHTML = '';
}
