import React from 'react';
import { createRoot } from 'react-dom/client';
import { UnauthCard } from './UnauthCard.jsx';
import { AppLogo } from '../../brand/app-logo/AppLogo.jsx';
import { Input } from '../../forms/input/Input.jsx';
import { Button } from '../../forms/button/Button.jsx';
function Demo(){
  const [email,setEmail]=React.useState('ana@dravensoft.dev');
  const [password,setPassword]=React.useState('dravensoft');

  return(<div style={{minHeight:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <UnauthCard
      brand={<AppLogo size="md" mark={<img src="../../../../../assets/rotor-crimson.svg" alt=""/>} name="Draven" dim="soft"/>}
      eyebrow="Delivery console" title="Welcome back"
      footer={<span>Forgot your password?</span>}>
      <div style={{display:'flex',flexDirection:'column',gap:'calc(var(--sp-1) * 4)'}}>
        <Input label="Email" value={email} onChange={setEmail}/>
        <Input label="Password" type="password" value={password} onChange={setPassword}/>
        <Button variant="primary" full>Sign in</Button>
      </div>
    </UnauthCard>
  </div>);
}
createRoot(document.getElementById('root')).render(<Demo/>);
