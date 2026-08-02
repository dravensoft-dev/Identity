import React from 'react';
import { createRoot } from 'react-dom/client';
import { BottomNav } from './BottomNav.tsx';
import { BottomNavItem } from '../bottom-nav-item/BottomNavItem.tsx';

function Card() {
  const [route, setRoute] = React.useState('home');
  return (
    <React.Fragment>
      <div className="sub">The bar as it sits, pinned to the bottom of the viewport</div>
      <p className="note">
        Height is <code>--layout-bar</code>, the stacking slot is <code>--z-nav</code>, and the
        padding under the labels is <code>--pad-safe-bottom</code>. The page reserves the same
        height, so its last row is never underneath. Current destination: <b>{route}</b>.
      </p>

      <BottomNav ariaLabel="Primary" active={route} onNav={setRoute}>
        <BottomNavItem id="home" icon="ph-bold ph-house" label="Home" href="#home" />
        <BottomNavItem id="orders" icon="ph-bold ph-receipt" label="Orders" href="#orders" badge={12} />
        <BottomNavItem id="clients" icon="ph-bold ph-users" label="Clients" href="#clients" badge={4821} />
        <BottomNavItem id="reports" icon="ph-bold ph-chart-bar" label="Reports" disabled />
        <BottomNavItem id="more" icon="ph-bold ph-dots-three" label="More" />
      </BottomNav>
    </React.Fragment>
  );
}

createRoot(document.getElementById('root')!).render(<Card />);
