import React from 'react';
import { createRoot } from 'react-dom/client';
import { RadioGroup, Radio } from '../../components/forms/Radio.jsx';
import { Textarea } from '../../components/forms/Textarea.jsx';
function Demo(){
  const [env,setEnv]=React.useState('staging');
  const [notes,setNotes]=React.useState('');
  return (
    <div className="row" style={{gap:40}}>
      <div style={{width:280}}>
        <div className="sub" style={{marginBottom:12}}>RadioGroup</div>
        <RadioGroup value={env} onChange={setEnv}>
          <Radio value="prod" label="Production" hint="Real users — requires approval" />
          <Radio value="staging" label="Staging" />
          <Radio value="qa" label="QA" />
        </RadioGroup>
      </div>
      <div style={{width:320}}>
        <Textarea label="Deployment notes" rows={5} maxLength={280} counter
          value={notes} onChange={e=>setNotes(e.target.value)}
          hint="Attached to the delivery log." />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
