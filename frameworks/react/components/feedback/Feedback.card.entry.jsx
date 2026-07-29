import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from './dialog/Dialog.jsx';
import { Toast } from './toast/Toast.jsx';
import { Tooltip } from './tooltip/Tooltip.jsx';
import { ProgressBar } from './progress-bar/ProgressBar.jsx';
import { Spinner } from './spinner/Spinner.jsx';
import { Button } from '../forms/button/Button.jsx';
function Demo(){const[o,setO]=React.useState(false);return(<div>
  <div className="sub">Toast</div>
  <div className="row" style={{alignItems:'flex-start'}}>
    <Toast tone="success" title="Deployment completed" message="build #4821 in production" dismissible onClose={()=>{}}/>
    <Toast tone="danger" title="Pipeline failed" message="e2e tests in checkout" dismissible onClose={()=>{}}/>
  </div>
  <div className="sub">Tooltip · Dialog</div>
  <div className="row">
    <Tooltip label="Roll back to the previous build"><Button variant="secondary">Hover here</Button></Tooltip>
    <Button variant="primary" onClick={()=>setO(true)}>Open dialog</Button>
  </div>
  <div className="sub">ProgressBar</div>
  <div className="row" style={{flexDirection:'column',alignItems:'stretch',gap:'calc(var(--sp-1) * 3.5)'}}>
    <ProgressBar label="Deploying build #4821" progressPercentage={64}/>
    <ProgressBar tone="success" label="Published" progressPercentage={100}/>
    <ProgressBar indeterminate label="Connecting…"/>
  </div>
  <div className="sub">Spinner — sizes and tones</div>
  <div className="row">
    <Spinner size="sm" label="Loading" />
    <Spinner size="md" label="Loading projects" />
    <Spinner size="lg" tone="gold" label="Connecting" />
    <Spinner tone="neutral" label="Loading" />
    <span style={{display:'inline-flex',alignItems:'center',gap:'var(--sp-2)',background:'var(--crimson)',color:'var(--on-accent)',borderRadius:'var(--r-sm)',padding:'0 calc(var(--sp-1) * 3.5)',height:'var(--dz-ctl-h)',fontFamily:'var(--font-body)',fontWeight:'var(--fw-semibold)',fontSize:'var(--dz-text)'}}>
      <Spinner size="sm" tone="on-accent" label="Deploying" />Deploying
    </span>
  </div>
  <Dialog open={o} onClose={()=>setO(false)} eyebrow="Confirm" title="Deploy to production"
    footer={<><Button variant="ghost" onClick={()=>setO(false)}>Cancel</Button><Button onClick={()=>setO(false)}>Deploy</Button></>}>
    This action publishes build #4821 for all users. It can be rolled back at any time.
  </Dialog>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
