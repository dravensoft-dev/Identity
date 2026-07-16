import React, { useState } from 'react';
import { Button } from '../../components/forms/Button.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Rotor } from '../../components/brand/Rotor.jsx';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('ana@dravensoft.dev');
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(120% 120% at 78% 12%, #2a201c 0%, #141010 60%)', padding: 24 }}>
      <div style={{ width: 380, background: 'var(--surface-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 36, boxShadow: 'var(--shadow-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Rotor size={40} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, letterSpacing: '-.02em', textTransform: 'uppercase', color: 'var(--bone)' }}>Draven<span style={{ color: 'var(--mute)' }}>soft</span></div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 6 }}>Consola de entrega</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--bone)', marginBottom: 24 }}>Bienvenida de nuevo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contraseña" type="password" defaultValue="dravensoft" />
          <Button variant="primary" full onClick={onLogin}>Entrar</Button>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mute)' }}>¿Olvidaste tu contraseña?</div>
      </div>
    </div>
  );
}
