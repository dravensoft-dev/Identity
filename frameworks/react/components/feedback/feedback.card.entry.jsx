import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Toast } from '../../components/feedback/Toast.jsx';
import { Tooltip } from '../../components/feedback/Tooltip.jsx';
import { ProgressBar } from '../../components/feedback/ProgressBar.jsx';
import { Spinner } from '../../components/feedback/Spinner.jsx';
import { Button } from '../../components/forms/Button.jsx';
function Demo(){const[o,setO]=React.useState(false);return(<div>
  <div className="sub">Toast</div>
  <div className="row" style={{alignItems:'flex-start'}}>
    <Toast tone="success" title="Deployment completed" message="build #4821 in production" onClose={()=>{}}/>
    <Toast tone="danger" title="Pipeline failed" message="e2e tests in checkout" onClose={()=>{}}/>
  </div>
  <div className="sub">Tooltip · Dialog</div>
  <div className="row">
    <Tooltip content="Roll back to the previous build"><Button variant="secondary">Hover here</Button></Tooltip>
    <Button variant="primary" onClick={()=>setO(true)}>Open dialog</Button>
  </div>
  <div className="sub">ProgressBar</div>
  <div className="row" style={{flexDirection:'column',alignItems:'stretch',gap:14}}>
    <ProgressBar label="Deploying build #4821" value={64}/>
    <ProgressBar tone="success" label="Published" value={100}/>
    <ProgressBar indeterminate label="Connecting…"/>
  </div>
  <div className="sub">Spinner — sizes and tones</div>
  <div className="row">
    <Spinner size="sm" label="Loading" />
    <Spinner size="md" label="Loading projects" />
    <Spinner size="lg" tone="gold" label="Connecting" />
    <Spinner tone="neutral" label="Loading" />
    <span style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--crimson)',color:'var(--on-accent)',borderRadius:'var(--r-sm)',padding:'0 14px',height:40,fontFamily:'var(--font-body)',fontWeight:600,fontSize:14}}>
      <Spinner size="sm" tone="on-accent" label="Deploying" />Deploying
    </span>
  </div>
  <Dialog open={o} onClose={()=>setO(false)} eyebrow="Confirm" title="Deploy to production"
    footer={<><Button variant="ghost" onClick={()=>setO(false)}>Cancel</Button><Button onClick={()=>setO(false)}>Deploy</Button></>}>
    This action publishes build #4821 for all users. It can be rolled back at any time.
  </Dialog>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
