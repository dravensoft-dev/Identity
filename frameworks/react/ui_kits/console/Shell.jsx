import React from 'react';
import { Rotor } from '../../components/brand/Rotor.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Icon } from './Icon.jsx';
import { PageHead } from '../../components/navigation/PageHead.jsx';

const NAV = [
  { id: 'dashboard', icon: 'grid', label: 'Projects' },
  { id: 'deploys', icon: 'rocket', label: 'Deployments' },
  { id: 'activity', icon: 'activity', label: 'Activity' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export function Shell({ active = 'dashboard', onNav, title, actions, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100%', background: 'var(--bg)' }}>
      <aside style={{ borderRight: 'var(--bw) solid var(--color-base-300)', padding: 'calc(var(--sp-1) * 6) calc(var(--sp-1) * 4)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', padding: '0 calc(var(--sp-1) * 2) calc(var(--sp-1) * 5.5)' }}>
          <Rotor size={30} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 17, letterSpacing: 'var(--ls-tight)', textTransform: 'uppercase', color: 'var(--bone)' }}>Dravensoft</div>
        </div>
        {NAV.map((n) => {
          const on = n.id === active;
          return (
            <button key={n.id} onClick={() => onNav && onNav(n.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)', padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3)', borderRadius: 'var(--r-sm)',
                background: on ? 'var(--crimson-soft)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                color: on ? 'var(--crimson)' : 'var(--mute)', fontFamily: 'var(--font-body)', fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)', fontSize: 'var(--dz-text)' }}>
              <Icon name={n.icon} size="var(--icon-lg)" />{n.label}
            </button>
          );
        })}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', padding: 'calc(var(--sp-1) * 3) calc(var(--sp-1) * 2)', borderTop: 'var(--bw) solid var(--color-base-300)' }}>
          <div style={{ width: 'calc(var(--sp-1) * 7.5)', height: 'calc(var(--sp-1) * 7.5)', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--dz-text-md)' }}>A</div>
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
            </>} />
        </header>
        <div style={{ padding: 'calc(var(--sp-1) * 8)', flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
