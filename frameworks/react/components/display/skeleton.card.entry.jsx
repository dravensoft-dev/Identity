import React from 'react';
import { createRoot } from 'react-dom/client';
import { Skeleton } from '../../components/display/Skeleton.jsx';
import { Card } from '../../components/display/Card.jsx';
function Demo(){return (<div>
  <div className="sub">Variants</div>
  <div className="row" style={{alignItems:'flex-start'}}>
    <div style={{width:200}}><Skeleton variant="text" lines={3} /></div>
    <Skeleton variant="line" width={160} />
    <Skeleton variant="block" width={120} height={72} />
    <Skeleton variant="circle" width={48} />
  </div>
  <div className="sub">In place — the placeholder matches the shape of what is loading</div>
  <div className="row" style={{alignItems:'stretch'}}>
    <Card eyebrow="Delivery" title="Client Portal" style={{width:300}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <Skeleton variant="circle" width={40} />
        <div style={{flex:1}}><Skeleton variant="text" lines={2} /></div>
      </div>
    </Card>
    <Card style={{width:280}}>
      <Skeleton variant="line" width="45%" height={11} style={{marginBottom:12}} />
      <Skeleton variant="block" height={90} />
    </Card>
  </div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
