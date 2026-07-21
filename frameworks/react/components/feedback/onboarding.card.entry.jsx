import React from 'react';
import { createRoot } from 'react-dom/client';
import { Onboarding } from '../../components/feedback/Onboarding.jsx';
import { Button } from '../../components/forms/Button.jsx';
const steps = [
  {eyebrow:'Welcome',title:'Your first deployment',body:'From here you will deploy and roll back with one click.'},
  {title:'Command palette',body:'Press Cmd/Ctrl+K to run any action without the mouse.'},
  {title:'All set',body:'You can reopen this guide from Help anytime.'},
];
function Demo(){
  const [open,setOpen]=React.useState(true);
  const [step,setStep]=React.useState(0);
  return(<div>
    <div className="sub">Skip is offered on every step — a tour is never a trap</div>
    <div className="row">
      <Button variant="secondary" size="sm" onClick={()=>{setStep(0);setOpen(true);}}>Start tour</Button>
      <span style={{color:'var(--mute)',fontFamily:'var(--font-mono)',fontSize:12}}>
        Step <span style={{color:'var(--gold)'}}>{Math.min(step+1,steps.length)}</span> of {steps.length}
        {!open && ' · dismissed'}
      </span>
    </div>
    <Onboarding open={open} index={step} steps={steps}
      onNext={()=>setStep(s=>s+1)} onBack={()=>setStep(s=>s-1)}
      onSkip={()=>setOpen(false)} onDone={()=>setOpen(false)} />
  </div>);
}
createRoot(document.getElementById('root')).render(<Demo/>);
