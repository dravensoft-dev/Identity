import React from 'react';
import { createRoot } from 'react-dom/client';
import { Skeleton } from '../../components/display/Skeleton.jsx';
import { Card } from '../../components/display/Card.jsx';
function Demo(){return (<div>
  <div className="sub">Variants</div>
  <div className="row" style={{alignItems:'flex-start'}}>
    <div style={{width:'calc(var(--sp-1) * 50)'}}><Skeleton variant="text" lines={3} /></div>
    <Skeleton variant="line" width="160px" />
    <Skeleton variant="block" width="120px" height="72px" />
    <Skeleton variant="circle" width="48px" />
  </div>
  <div className="sub">In place — the placeholder matches the shape of what is loading</div>
  <div className="row" style={{alignItems:'stretch'}}>
    <Card eyebrow="Delivery" title="Client Portal" style={{width:'calc(var(--sp-1) * 75)'}}>
      <div style={{display:'flex',gap:'var(--sp-3)',alignItems:'center'}}>
        <Skeleton variant="circle" width="40px" />
        <div style={{flex:1}}><Skeleton variant="text" lines={2} /></div>
      </div>
    </Card>
    <Card style={{width:'calc(var(--sp-1) * 70)'}}>
      <div style={{marginBottom:'var(--sp-3)'}}><Skeleton variant="line" width="45%" height="11px" /></div>
      <Skeleton variant="block" height="90px" />
    </Card>
  </div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
