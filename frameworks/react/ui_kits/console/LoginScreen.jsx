import React, { useState } from 'react';
import { Button } from '../../components/forms/Button.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Rotor } from '../../components/brand/Rotor.jsx';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('ana@dravensoft.dev');
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: 380, background: 'var(--surface-card)', border: '1px solid var(--color-base-300)', borderRadius: 'var(--r-lg)', padding: 36, boxShadow: 'var(--shadow-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Rotor size={40} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, letterSpacing: '-.02em', textTransform: 'uppercase', color: 'var(--bone)' }}>Draven<span style={{ color: 'var(--mute)' }}>soft</span></div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 6 }}>Delivery console</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--bone)', marginBottom: 24 }}>Welcome back</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" defaultValue="dravensoft" />
          <Button variant="primary" full onClick={onLogin}>Sign in</Button>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>Forgot your password?</div>
      </div>
    </div>
  );
}
