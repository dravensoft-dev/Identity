import React from 'react';
import { createRoot } from 'react-dom/client';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tag } from '../../components/display/Tag.jsx';
import { StatCard } from '../../components/display/StatCard.jsx';
function Demo(){return (<div>
  <div className="sub">Badge — tones</div>
  <div className="row">
    <Badge tone="success" dot>Deployed</Badge>
    <Badge tone="warning">In review</Badge>
    <Badge tone="danger" dot>Down</Badge>
    <Badge tone="accent">New</Badge>
    <Badge tone="gold">Priority</Badge>
    <Badge tone="info">v2.4</Badge>
    <Badge>Draft</Badge>
  </div>
  <div className="sub">Tag</div>
  <div className="row"><Tag>TypeScript</Tag><Tag>PostgreSQL</Tag><Tag onRemove={()=>{}}>React</Tag></div>
  <div className="sub">Card</div>
  <div className="row" style={{alignItems:'stretch'}}>
    <Card eyebrow="Delivery" title="Client Portal" action={<Badge tone="success" dot>Deployed</Badge>} style={{width:'calc(var(--sp-1) * 75)'}}>
      <div style={{color:'var(--mute)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>Last published 2 h ago · build #4821</div>
    </Card>
    <Card accent floating title="Latency alert" style={{width:'calc(var(--sp-1) * 70)'}}>
      <div style={{color:'var(--mute)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>p95 rose to 340 ms on checkout.</div>
    </Card>
  </div>
  <div className="sub">StatCard — the value says what IS, the pill says how it MOVED</div>
  <div className="row" style={{alignItems:'stretch'}}>
    <div style={{flex:1,display:'flex'}}><StatCard label="Deploys" value="128" delta={{value:'+12%',direction:'up',tone:'positive'}} sub="vs last week" /></div>
    <div style={{flex:1,display:'flex'}}><StatCard label="p95 latency" value="340 ms" delta={{value:'-18%',direction:'down',tone:'positive'}} sub="vs last week" /></div>
    {/* The two tones disagree here, which is the point: three open incidents is
        still a bad state, and it is still an improvement on five. */}
    <div style={{flex:1,display:'flex'}}><StatCard label="Open incidents" value="3" tone="danger" delta={{value:'-2',direction:'down',tone:'positive'}} sub="2 acknowledged" /></div>
    <div style={{flex:1,display:'flex'}}><StatCard label="Build time" value="4m 12s" delta={{value:'+3s',direction:'up'}} /></div>
  </div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
