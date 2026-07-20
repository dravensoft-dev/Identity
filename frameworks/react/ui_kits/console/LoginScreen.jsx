import React, { useState } from 'react';
import { Button } from '../../components/forms/Button.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { AppLogo } from '../../components/brand/AppLogo.jsx';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('ana@dravensoft.dev');
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 'calc(var(--sp-1) * 6)' }}>
      <div style={{ width: 'calc(var(--sp-1) * 95)', background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 9)', boxShadow: 'var(--shadow-3)' }}>
        <div style={{ display: 'flex', marginBottom: 'calc(var(--sp-1) * 7)' }}>
          <AppLogo size="md" mark={<img src="../../../../assets/rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 1.5)' }}>Delivery console</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h3)', color: 'var(--bone)', marginBottom: 'calc(var(--sp-1) * 6)' }}>Welcome back</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4)' }}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" defaultValue="dravensoft" />
          <Button variant="primary" full onClick={onLogin}>Sign in</Button>
        </div>
        <div style={{ marginTop: 'calc(var(--sp-1) * 5)', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>Forgot your password?</div>
      </div>
    </div>
  );
}
