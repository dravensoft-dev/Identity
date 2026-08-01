import React from 'react';
import { createRoot } from 'react-dom/client';
import { Card } from './card/Card.tsx';
import { Badge } from './badge/Badge.tsx';
import { Tag } from './tag/Tag.tsx';
import { StatCard } from './stat-card/StatCard.tsx';
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
  <div className="sub">Tag — tones and dismiss</div>
  <div className="row">
    <Tag>Neutral</Tag>
    <Tag tone="primary">Primary</Tag>
    <Tag tone="success">Success</Tag>
    <Tag tone="warning">Warning</Tag>
    <Tag tone="danger">Danger</Tag>
    <Tag removable onRemove={()=>{}}>React</Tag>
    <Tag removable disabled onRemove={()=>{}}>Locked</Tag>
  </div>
  <div className="sub">Card</div>
  <div className="row" style={{alignItems:'stretch'}}>
    <div style={{width:'calc(var(--sp-1) * 75)',display:'grid'}}>
      <Card interactive onClick={() => {}} eyebrow="Delivery" title="Client Portal" action={<Badge tone="success" dot>Deployed</Badge>}>
        <div style={{color:'var(--mute)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>Last published 2 h ago · build #4821</div>
      </Card>
    </div>
    <div style={{width:'calc(var(--sp-1) * 70)',display:'grid'}}>
      <Card accent floating title="Latency alert">
        <div style={{color:'var(--mute)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>p95 rose to 340 ms on checkout.</div>
      </Card>
    </div>
  </div>
  <div className="sub">StatCard — the value says what IS, the pill says how it MOVED</div>
  <div className="row" style={{alignItems:'stretch'}}>
    <div style={{flex:1,display:'flex'}}><StatCard label="Deploys" value="128" delta={{value:'+12%',direction:'up',tone:'positive'}} sub="vs last week" /></div>
    <div style={{flex:1,display:'flex'}}><StatCard label="p95 latency" value="340 ms" delta={{value:'-18%',direction:'down',tone:'positive'}} sub="vs last week" /></div>
    {
}
    <div style={{flex:1,display:'flex'}}><StatCard label="Open incidents" value="3" tone="danger" delta={{value:'-2',direction:'down',tone:'positive'}} sub="2 acknowledged" /></div>
    <div style={{flex:1,display:'flex'}}><StatCard label="Build time" value="4m 12s" delta={{value:'+3s',direction:'up'}} /></div>
  </div>
</div>);}
createRoot(document.getElementById('root')!).render(<Demo/>);
