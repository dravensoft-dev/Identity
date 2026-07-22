import React from 'react';
import { createRoot } from 'react-dom/client';
import { Alert } from '../../components/feedback/Alert.jsx';
function Demo(){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'calc(var(--sp-1) * 3.5)',maxWidth:'calc(var(--sp-1) * 130)'}}>
      <Alert tone="info" title="New version available">Arena 1.0 includes Radio, Table, Menu, and Alert.</Alert>
      <Alert tone="success" title="Deployment completed">build #4821 in production.</Alert>
      <Alert tone="warning" title="Staging environment" action={{label:'Go to production',onClick:()=>{}}}>Changes here don't affect real users.</Alert>
      <Alert tone="danger" title="Certificate expired" onClose={()=>{}}>Renew the TLS within 48 h to avoid outages.</Alert>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Demo/>);
