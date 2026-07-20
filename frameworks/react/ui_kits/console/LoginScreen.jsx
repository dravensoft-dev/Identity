import React, { useState } from 'react';
import { Button } from '../../components/forms/Button.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { AppLogo } from '../../components/brand/AppLogo.jsx';
import { UnauthCard } from '../../components/display/UnauthCard.jsx';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('ana@dravensoft.dev');
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 'calc(var(--sp-1) * 6)' }}>
      <UnauthCard
        brand={<AppLogo size="md" mark={<img src="../../../../assets/rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />}
        eyebrow="Delivery console"
        title="Welcome back"
        footer="Forgot your password?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4)' }}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" defaultValue="dravensoft" />
          <Button variant="primary" full onClick={onLogin}>Sign in</Button>
        </div>
      </UnauthCard>
    </div>
  );
}
