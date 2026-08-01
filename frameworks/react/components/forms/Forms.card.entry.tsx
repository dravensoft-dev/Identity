import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from './button/Button.tsx';
import { IconButton } from './icon-button/IconButton.tsx';
import { Input } from './input/Input.tsx';
import { Select } from './select/Select.tsx';
import { Checkbox } from './checkbox/Checkbox.tsx';
import { Switch } from './switch/Switch.tsx';
function Demo(){
  const [chk,setChk]=React.useState(true);
  const [sw,setSw]=React.useState(true);
  const [email,setEmail]=React.useState('hello@');
  return (
    <div>
      <div className="sub">Button — variants</div>
      <div className="row">
        <Button variant="primary" icon="ph-bold ph-plus">Deploy</Button>
        <Button variant="secondary">Roll back</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="primary" loading>Deploying</Button>
        <Button variant="primary" disabled>Locked</Button>
      </div>
      <div className="sub">Sizes · IconButton</div>
      <div className="row">
        <Button size="sm" variant="secondary">sm</Button>
        <Button size="md" variant="secondary">md</Button>
        <Button size="lg" variant="secondary">lg</Button>
        <IconButton label="New" variant="solid" icon="ph-bold ph-plus" />
        <IconButton label="New" icon="ph-bold ph-plus" />
        <IconButton label="Pin this view" pressed icon="ph-bold ph-push-pin" />
        <IconButton label="Pin this view" pressed={false} icon="ph-bold ph-push-pin" />
      </div>
      <div className="sub">Input · Select</div>
      <div className="row" style={{alignItems:'flex-start'}}>
        <div style={{width:'calc(var(--sp-1) * 55)'}}>
          <Input label="Repository" prefix="git@" placeholder="org/project" />
        </div>
        <div style={{width:'calc(var(--sp-1) * 50)'}}>
          <Input label="Email" error="Invalid format" value={email} onChange={setEmail} />
        </div>
        <div style={{width:'calc(var(--sp-1) * 45)'}}>
          <Select label="Environment" options={[{value:'Production',label:'Production'},{value:'Staging',label:'Staging'},{value:'QA',label:'QA'}]} />
        </div>
        <div style={{width:'calc(var(--sp-1) * 45)'}}>
          <Input label="Cluster" value="eu-west-1" readOnly hint="Set at project creation" />
        </div>
      </div>
      <div className="sub">Input — native date and time</div>
      <div className="row" style={{alignItems:'flex-start'}}>
        <div style={{width:'calc(var(--sp-1) * 50)'}}>
          <Input label="Deploy date" type="date" required />
        </div>
        <div style={{width:'calc(var(--sp-1) * 50)'}}>
          <Input label="Window start" type="time" hint="Local time" />
        </div>
        <div style={{width:'calc(var(--sp-1) * 60)'}}>
          <Input label="Cutover" type="datetime-local" />
        </div>
        <div style={{width:'calc(var(--sp-1) * 50)'}}>
          <Input label="Deadline" type="date" error="Pick a date in the future" />
        </div>
      </div>
      <div className="sub">Checkbox · Switch</div>
      <div className="row">
        <Checkbox checked={chk} onChange={setChk} label="Notify on approval" />
        <Switch state={sw} onFuncOn={()=>setSw(true)} onFuncOff={()=>setSw(false)} label="Automatic deployment" />
      </div>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<Demo/>);
