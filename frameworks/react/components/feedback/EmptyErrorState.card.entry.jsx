import React from 'react';
import { createRoot } from 'react-dom/client';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { ErrorState } from '../../components/feedback/ErrorState.jsx';
import { Button } from '../../components/forms/Button.jsx';
function Demo(){return(<div>
  <div className="sub">Neither state is a dead end — each one names the way out</div>
  <div className="row">
    <div style={{flex:'1 1 0',minWidth:0,boxSizing:'border-box'}}>
      <EmptyState icon="ph-duotone ph-folder-open"
        title="No projects yet" message="Create your first project to start deploying."
        action={<Button>New project</Button>} />
    </div>
    <div style={{flex:'1 1 0',minWidth:0,boxSizing:'border-box'}}>
      <ErrorState icon="ph-fill ph-warning-octagon"
        title="Couldn't load the panel" message="No connection to the metrics service."
        code="ERR_UPSTREAM_504" retryLabel="Retry" onRetry={()=>{}}
        secondaryAction={<Button variant="secondary">View logs</Button>} />
    </div>
  </div>
  <div className="sub">EmptyState invites the first action · ErrorState retries and exposes the code</div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
