import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../components/forms/Button.jsx';
import { IconButton } from '../../components/forms/IconButton.jsx';
import { Input } from '../../components/forms/Input.jsx';
import { Select } from '../../components/forms/Select.jsx';
import { Checkbox } from '../../components/forms/Checkbox.jsx';
import { Switch } from '../../components/forms/Switch.jsx';
import { ThemeToggle } from '../../components/forms/ThemeToggle.jsx';
const plus = <i className="ph-bold ph-plus" style={{fontSize:'var(--icon-md)',lineHeight:'var(--dz-lh)'}} />;
function Demo(){
  const [chk,setChk]=React.useState(true);
  const [sw,setSw]=React.useState(true);
  return (
    <div>
      <div className="sub">Button — variants</div>
      <div className="row">
        <Button variant="primary" icon={plus}>Deploy</Button>
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
        <IconButton label="New" variant="solid">{plus}</IconButton>
        <IconButton label="New">{plus}</IconButton>
      </div>
      <div className="sub">Input · Select</div>
      <div className="row" style={{alignItems:'flex-start'}}>
        <Input label="Repository" prefix="git@" placeholder="org/project" style={{width:'calc(var(--sp-1) * 55)'}} />
        <Input label="Email" error="Invalid format" defaultValue="hello@" style={{width:'calc(var(--sp-1) * 50)'}} />
        <Select label="Environment" options={['Production','Staging','QA']} style={{width:'calc(var(--sp-1) * 45)'}} />
      </div>
      <div className="sub">Input — native date and time</div>
      <div className="row" style={{alignItems:'flex-start'}}>
        <Input label="Deploy date" type="date" required style={{width:'calc(var(--sp-1) * 50)'}} />
        <Input label="Window start" type="time" hint="Local time" style={{width:'calc(var(--sp-1) * 50)'}} />
        <Input label="Cutover" type="datetime-local" style={{width:'calc(var(--sp-1) * 60)'}} />
        <Input label="Deadline" type="date" error="Pick a date in the future" style={{width:'calc(var(--sp-1) * 50)'}} />
      </div>
      <div className="sub">Checkbox · Switch</div>
      <div className="row">
        <Checkbox checked={chk} onChange={e=>setChk(e.target.checked)} label="Notify on approval" />
        <Switch state={sw} onFuncOn={()=>setSw(true)} onFuncOff={()=>setSw(false)} label="Automatic deployment" />
      </div>
      <div className="sub">ThemeToggle</div>
      <div className="row"><ThemeToggle /><span style={{fontSize:'var(--dz-text-md)',color:'var(--mute)'}}>Flips the whole page — every component re-themes from tokens alone.</span></div>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<Demo/>);
