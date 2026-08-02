import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ToastPlacement } from '../../../Api.generated';
import { Toast } from '../toast/Toast.tsx';
import { ToastHost } from './ToastHost.tsx';

const CORNERS: [ToastPlacement, React.ComponentProps<typeof Toast>][] = [
  ['top-start', { title: 'top-start', message: 'Pinned to the block start and the inline start.' }],
  ['top-end', { tone: 'success', title: 'top-end', message: 'Both top stacks clear the notch.' }],
  ['bottom-start', { tone: 'gold', title: 'bottom-start', message: 'The inline half flips with the document.' }],
  ['bottom-end', { tone: 'danger', title: 'bottom-end', message: 'The default. Clears the home indicator.' }],
];

function Card() {
  return (
    <React.Fragment>
      <div className="sub">Four placements, each pinned to the viewport itself</div>
      <p className="note">
        The box is fixed, so it is measured against the viewport and not against this page. It
        carries no role and no live region: each notice announces for itself.
      </p>
      {CORNERS.map(([placement, notice]) => (
        <ToastHost key={placement} placement={placement}>
          <Toast {...notice} />
        </ToastHost>
      ))}
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')!).render(<Card />);
