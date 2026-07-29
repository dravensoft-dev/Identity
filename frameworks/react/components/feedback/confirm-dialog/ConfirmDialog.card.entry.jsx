import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog.jsx';
import { Button } from '../../components/forms/Button.jsx';
function Demo(){
  const [hard,setHard]=React.useState(true);
  const [soft,setSoft]=React.useState(false);
  return(<div>
    <div className="sub">The trigger stays outline · only the final confirmation is filled</div>
    <div className="row">
      <Button variant="danger" onClick={()=>setHard(true)}>Delete project…</Button>
      <Button variant="secondary" onClick={()=>setSoft(true)}>Enable auto-deploy…</Button>
    </div>
    <div className="sub">requireText makes the irreversible one deliberate — no click-outside either</div>
    <ConfirmDialog open={hard} destructive requireText="DELETE" title="Delete project"
      confirmLabel="Delete permanently" onCancel={()=>setHard(false)} onConfirm={()=>setHard(false)}>
      This action cannot be undone. 4 deployments and their history will be deleted.
    </ConfirmDialog>
    <ConfirmDialog open={soft} title="Enable automatic deployment" confirmLabel="Enable"
      onCancel={()=>setSoft(false)} onConfirm={()=>setSoft(false)}>
      Every approved commit will be deployed to production without manual review.
    </ConfirmDialog>
  </div>);
}
createRoot(document.getElementById('root')).render(<Demo/>);
