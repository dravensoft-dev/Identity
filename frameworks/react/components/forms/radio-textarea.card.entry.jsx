import React from 'react';
import { createRoot } from 'react-dom/client';
import { RadioGroup, Radio } from '../../components/forms/Radio.jsx';
import { Textarea } from '../../components/forms/Textarea.jsx';
function Demo(){
  const [env,setEnv]=React.useState('staging');
  const [notes,setNotes]=React.useState('');
  return (
    <div className="row" style={{gap:'var(--sp-10)'}}>
      <div style={{width:'calc(var(--sp-1) * 70)'}}>
        <div className="sub" style={{marginBottom:'var(--sp-3)'}}>RadioGroup</div>
        <RadioGroup value={env} onChange={setEnv}>
          <Radio value="prod" label="Production" hint="Real users — requires approval" />
          <Radio value="staging" label="Staging" />
          <Radio value="qa" label="QA" />
        </RadioGroup>
      </div>
      <div style={{width:'calc(var(--sp-1) * 80)'}}>
        <Textarea label="Deployment notes" rows={5} maxLength={280} counter
          value={notes} onChange={e=>setNotes(e.target.value)}
          hint="Attached to the delivery log." />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
