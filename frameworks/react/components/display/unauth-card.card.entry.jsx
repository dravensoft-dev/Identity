import React from 'react';
import { createRoot } from 'react-dom/client';
import { UnauthCard } from '../../components/display/UnauthCard.jsx';
import { AppLogo } from '../../components/brand/AppLogo.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Button } from '../../components/forms/Button.jsx';
function Demo(){
  const [email,setEmail]=React.useState('ana@dravensoft.dev');
  /* The three-line centring wrapper the component deliberately does not impose. */
  return(<div style={{minHeight:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <UnauthCard
      brand={<AppLogo size="md" mark={<img src="../../../../assets/rotor-crimson.svg" alt=""/>} name="Draven" dim="soft"/>}
      eyebrow="Delivery console" title="Welcome back"
      footer={<span>Forgot your password?</span>}>
      <div style={{display:'flex',flexDirection:'column',gap:'calc(var(--sp-1) * 4)'}}>
        <Input label="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
        <Input label="Password" type="password" defaultValue="dravensoft"/>
        <Button variant="primary" full>Sign in</Button>
      </div>
    </UnauthCard>
  </div>);
}
createRoot(document.getElementById('root')).render(<Demo/>);
