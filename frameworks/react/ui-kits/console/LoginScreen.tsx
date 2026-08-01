import React, { useState } from 'react';
import { Button } from '../../components/forms/button/Button.tsx';
import { Input } from '../../components/forms/input/Input.tsx';
import { AppLogo } from '../../components/brand/app-logo/AppLogo.tsx';
import { UnauthCard } from '../../components/display/unauth-card/UnauthCard.tsx';

export interface LoginScreenProps {
  onLogin?: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('ana@dravensoft.dev');
  const [password, setPassword] = useState('dravensoft');
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 'calc(var(--sp-1) * 6)' }}>
      <UnauthCard
        brand={<AppLogo size="md" mark={<img src="../../../../assets/rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />}
        eyebrow="Delivery console"
        title="Welcome back"
        footer="Forgot your password?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4)' }}>
          <Input label="Email" value={email} onChange={setEmail} />
          <Input label="Password" type="password" value={password} onChange={setPassword} />
          <Button variant="primary" full onClick={onLogin}>Sign in</Button>
        </div>
      </UnauthCard>
    </div>
  );
}
