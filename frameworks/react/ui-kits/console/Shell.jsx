import React, { useEffect, useState } from 'react';
import { AppLogo } from '../../components/brand/AppLogo.jsx';
import { Avatar } from '../../components/display/Avatar.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Switch } from '../../components/forms/Switch.jsx';
import { PageHead } from '../../components/navigation/PageHead.jsx';
import { SideNav } from '../../components/navigation/SideNav.jsx';
import { SideNavItem } from '../../components/navigation/SideNavItem.jsx';

/* Owns no theme state of its own: the truth is the `arena-light` class on
 * <html>, and this reads it. The MutationObserver below is what keeps that
 * honest -- if theme.js or another tab flips the theme, the Switch re-renders
 * to match. theme.js is an IIFE with no exports, so the only handle it offers
 * is window.__toggleTheme; use it when present, otherwise do the same two
 * things it does, against the same class and the same storage key. */
const THEME_STORAGE_KEY = 'draven-theme';
const isDarkNow = () =>
  typeof document !== 'undefined' && !document.documentElement.classList.contains('arena-light');

function flipTheme() {
  if (typeof window !== 'undefined' && typeof window.__toggleTheme === 'function') {
    window.__toggleTheme();
    return;
  }
  const goingLight = isDarkNow();
  document.documentElement.classList.toggle('arena-light', goingLight);
  try { localStorage.setItem(THEME_STORAGE_KEY, goingLight ? 'light' : 'dark'); } catch (_) {}
}

export function Shell({ active = 'dashboard', onNav, title, actions, children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(isDarkNow());
    const mo = new MutationObserver(() => setIsDark(isDarkNow()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--layout-sidebar) 1fr', minHeight: '100%', background: 'var(--bg)' }}>
      <aside style={{ borderRight: 'var(--bw) solid var(--color-base-300)', padding: 'calc(var(--sp-1) * 6) calc(var(--sp-1) * 4)', display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1)' }}>
        <div style={{ display: 'flex', padding: '0 calc(var(--sp-1) * 2) calc(var(--sp-1) * 5.5)' }}>
          <AppLogo size="sm" mark={<img src="../../../../assets/rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />
        </div>
        {/* `onNav` carries the activated id and no DOM event, so the anchor's
            own navigation is no longer suppressible from here -- and does not
            need to be: every href is a hash anchor, so the browser moves the
            fragment and never reloads, while the screen switch still happens in
            place off the reported id. The items keep their href either way:
            openable in a new tab, announced as links.

            Phosphor class names rather than <Icon> elements: an item's `icon` is
            a string Arena draws, per the single-icon convention. Each was the
            class the console's own Icon component produced from its short name,
            at the size Arena now draws every one of them.

            SIBLINGS, never a fragment: SideNav injects into the children it is
            handed and React.Children.toArray does not see through a <>…</>. */}
        <SideNav ariaLabel="Primary" active={active} onNav={(id) => onNav?.(id)}>
          <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="#projects" />
          <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="#deploys" />
          <SideNavItem id="activity" icon="ph-bold ph-pulse" label="Activity" href="#activity" />
          <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" href="#settings" />
        </SideNav>
        {/* No bottom padding: the aside already ends in its own, and doubling
            them left the avatar sitting on a band of empty space. */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', padding: 'calc(var(--sp-1) * 3) calc(var(--sp-1) * 2) 0', borderTop: 'var(--bw) solid var(--color-base-300)' }}>
          <Avatar name="Ana Torres" size="sm" status="online" />
          <div style={{ lineHeight: 'var(--lh-snug)' }}><div style={{ fontSize: 'var(--dz-text-md)', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)' }}>Ana Torres</div><div style={{ fontSize: 'var(--dz-text-xs)', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>Delivery Lead</div></div>
        </div>
      </aside>
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ padding: 'calc(var(--sp-1) * 5) calc(var(--sp-1) * 8)', borderBottom: 'var(--bw) solid var(--color-base-300)' }}>
          <PageHead title={title} align="center"
            actions={<>
              {actions}
              <IconButton label="Search" icon="ph-bold ph-magnifying-glass" />
              <IconButton label="Notifications" icon="ph-bold ph-bell" />
              <Switch state={isDark} iconOn="ph-bold ph-sun" iconOff="ph-bold ph-moon" label="Theme"
                onFuncOn={() => { flipTheme(); setIsDark(true); }}
                onFuncOff={() => { flipTheme(); setIsDark(false); }} />
            </>} />
        </header>
        <div style={{ padding: 'calc(var(--sp-1) * 8)', flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
