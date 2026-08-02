import React from 'react';
import { createRoot } from 'react-dom/client';
import type { SheetPlacement } from '../../../Api.generated';
import { Button } from '../../forms/button/Button.tsx';
import { Sheet } from './Sheet.tsx';

const PLACEMENTS: SheetPlacement[] = ['bottom', 'start', 'end'];

function Card() {
  const [placement, setPlacement] = React.useState<SheetPlacement>('end');
  const [open, setOpen] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(false);
  const [pokes, setPokes] = React.useState(0);

  return (
    <React.Fragment>
      <div className="sub">The edge is the whole placement API</div>
      <div className="row">
        {PLACEMENTS.map((edge) => (
          <Button key={edge} variant={edge === placement ? 'primary' : 'ghost'} onClick={() => setPlacement(edge)}>
            {edge}
          </Button>
        ))}
      </div>

      <div className="sub">Closed and folded are two different states, and both are here</div>
      <div className="row">
        <Button onClick={() => setOpen(!open)}>{open ? 'Close' : 'Open'} the panel</Button>
        <Button variant="secondary" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? 'Unfold' : 'Fold'} the body
        </Button>
      </div>

      <div className="sub">The page behind stays usable</div>
      <div className="row">
        <Button variant="ghost" onClick={() => setPokes(pokes + 1)}>Poked {pokes} times</Button>
      </div>
      <p className="note">
        No scrim, no focus trap, no modality. Press the button above while the panel is open: it
        answers, which is exactly what a dialog would not let it do.
      </p>

      <Sheet open={open} placement={placement} title="Cart"
        collapsed={collapsed} onCollapsedChange={setCollapsed}
        dismissible onClose={() => setOpen(false)}
        footer={(
          <React.Fragment>
            <Button variant="ghost" onClick={() => setOpen(false)}>Keep shopping</Button>
            <Button onClick={() => setPokes(pokes + 1)}>Checkout</Button>
          </React.Fragment>
        )}>
        <p>Two line items. The footer below stays put while this body scrolls, and survives a fold.</p>
      </Sheet>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')!).render(<Card />);
