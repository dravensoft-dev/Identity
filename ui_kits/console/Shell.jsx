import React from 'react';
import { Rotor } from '../../components/brand/Rotor.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Icon } from './Icon.jsx';

const NAV = [
  { id: 'dashboard', icon: 'grid', label: 'Proyectos' },
  { id: 'deploys', icon: 'rocket', label: 'Despliegues' },
  { id: 'activity', icon: 'activity', label: 'Actividad' },
  { id: 'settings', icon: 'settings', label: 'Ajustes' },
];

export function Shell({ active = 'dashboard', onNav, title, actions, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100%', background: 'var(--bg)' }}>
      <aside style={{ borderRight: '1px solid var(--line)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px' }}>
          <Rotor size={30} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17, letterSpacing: '-.02em', textTransform: 'uppercase', color: 'var(--bone)' }}>Dravensoft</div>
        </div>
        {NAV.map((n) => {
          const on = n.id === active;
          return (
            <button key={n.id} onClick={() => onNav && onNav(n.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-sm)',
                background: on ? 'var(--crimson-soft)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                color: on ? 'var(--crimson)' : 'var(--mute)', fontFamily: 'var(--font-body)', fontWeight: on ? 600 : 500, fontSize: 14 }}>
              <Icon name={n.icon} size={18} />{n.label}
            </button>
          );
        })}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px', borderTop: '1px solid var(--line)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>A</div>
          <div style={{ lineHeight: 1.2 }}><div style={{ fontSize: 13, color: 'var(--bone-dim)', fontFamily: 'var(--font-body)' }}>Ana Torres</div><div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>Delivery Lead</div></div>
        </div>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--bone)', letterSpacing: '-.01em' }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {actions}
            <IconButton label="Buscar"><Icon name="search" /></IconButton>
            <IconButton label="Notificaciones"><Icon name="bell" /></IconButton>
          </div>
        </header>
        <div style={{ padding: 32, flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
