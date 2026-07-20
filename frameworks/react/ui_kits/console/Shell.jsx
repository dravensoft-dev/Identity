import React from 'react';
import { AppLogo } from '../../components/brand/AppLogo.jsx';
import { Avatar } from '../../components/display/Avatar.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { ThemeToggle } from '../../components/forms/ThemeToggle.jsx';
import { Icon } from './Icon.jsx';
import { PageHead } from '../../components/navigation/PageHead.jsx';
import { SideNav } from '../../components/navigation/SideNav.jsx';

const NAV = [
  { id: 'dashboard', icon: <Icon name="grid" size="var(--icon-lg)" />, label: 'Projects', href: '#projects' },
  { id: 'deploys', icon: <Icon name="rocket" size="var(--icon-lg)" />, label: 'Deployments', href: '#deploys' },
  { id: 'activity', icon: <Icon name="activity" size="var(--icon-lg)" />, label: 'Activity', href: '#activity' },
  { id: 'settings', icon: <Icon name="settings" size="var(--icon-lg)" />, label: 'Settings', href: '#settings' },
];

export function Shell({ active = 'dashboard', onNav, title, actions, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--layout-sidebar) 1fr', minHeight: '100%', background: 'var(--bg)' }}>
      <aside style={{ borderRight: 'var(--bw) solid var(--color-base-300)', padding: 'calc(var(--sp-1) * 6) calc(var(--sp-1) * 4)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1)' }}>
        <div style={{ display: 'flex', padding: '0 calc(var(--sp-1) * 2) calc(var(--sp-1) * 5.5)' }}>
          <AppLogo size="sm" mark={<img src="../../../../assets/rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />
        </div>
        {/* The console is one page, so the anchors' default navigation is
            suppressed here and the screen switch happens in place. The items keep
            their href: openable in a new tab, announced as links. */}
        <SideNav ariaLabel="Primary" items={NAV} active={active}
          onNav={(id, event) => { event.preventDefault(); if (onNav) onNav(id); }} />
        {/* No bottom padding: the aside already ends in its own, and doubling
            them left the avatar sitting on a band of empty space. */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', padding: 'calc(var(--sp-1) * 3) calc(var(--sp-1) * 2) 0', borderTop: 'var(--bw) solid var(--color-base-300)' }}>
          <Avatar name="Ana Torres" size="sm" status="online" />
          <div style={{ lineHeight: 'var(--lh-snug)' }}><div style={{ fontSize: 'var(--dz-text-md)', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)' }}>Ana Torres</div><div style={{ fontSize: 'var(--dz-text-xs)', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>Delivery Lead</div></div>
        </div>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ padding: 'calc(var(--sp-1) * 5) calc(var(--sp-1) * 8)', borderBottom: 'var(--bw) solid var(--color-base-300)' }}>
          <PageHead title={title} style={{ marginBottom: 0, alignItems: 'center' }}
            actions={<>
              {actions}
              <IconButton label="Search"><Icon name="search" /></IconButton>
              <IconButton label="Notifications"><Icon name="bell" /></IconButton>
              <ThemeToggle />
            </>} />
        </header>
        <div style={{ padding: 'calc(var(--sp-1) * 8)', flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
