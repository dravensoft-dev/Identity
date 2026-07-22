import React from 'react';
import { createRoot } from 'react-dom/client';
import { ActivityFeed } from '../../components/display/ActivityFeed.jsx';
import { Card } from '../../components/display/Card.jsx';
const ITEMS = [
  {id:1,actor:'ana@',action:'approved the release',target:'build #4821',time:'2h ago',tone:'success'},
  {id:2,actor:'CI',action:'deployed to production',target:'build #4821',time:'2h ago'},
  {id:3,actor:'diego@',action:'opened incident',target:'checkout latency',time:'3h ago',tone:'danger'},
  {id:4,actor:'nora@',action:'merged',target:'PR #338 · session cache',time:'5h ago',tone:'info'},
];
function Demo(){return(<div>
  <div className="sub">Inside a Card — the feed renders no surface of its own</div>
  <Card><ActivityFeed items={ITEMS}/></Card>
  <div className="sub" style={{marginTop:'var(--sp-5)'}}>renderItem — the row the grammar does not fit</div>
  <Card><ActivityFeed items={[{id:9,label:'Retention policy changed by two people at once'}]}
    renderItem={(e)=><span style={{fontSize:'var(--dz-text)',color:'var(--bone-dim)'}}>{e.label}</span>}/></Card>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
