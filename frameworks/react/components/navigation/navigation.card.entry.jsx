import React from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs } from '../../components/navigation/Tabs.jsx';
import { SegmentedControl } from '../../components/navigation/SegmentedControl.jsx';
import { PageHead } from '../../components/navigation/PageHead.jsx';
import { Breadcrumbs } from '../../components/navigation/Breadcrumbs.jsx';
import { SideNav } from '../../components/navigation/SideNav.jsx';
import { BulkActionBar } from '../../components/navigation/BulkActionBar.jsx';
import { Button } from '../../components/forms/Button.jsx';
function Demo(){const[v,setV]=React.useState('Overview');const[range,setRange]=React.useState('7d');const[sel,setSel]=React.useState(3);return(<div>
  <Tabs tabs={['Overview','Deployments','Activity','Settings']} value={v} onChange={setV}/>
  <div className="row" style={{marginTop:14}}>
    <div className="sub">SegmentedControl — filters inside the tab, never navigates</div>
    <SegmentedControl ariaLabel="Time range" options={['24h','7d','30d']} value={range} onChange={setRange}/>
    <span style={{color:'var(--mute)',fontFamily:'var(--font-mono)',fontSize:12}}>Active view: <span style={{color:'var(--gold)'}}>{v}</span> · Range: <span style={{color:'var(--gold)'}}>{range}</span></span>
  </div>
  <div className="sub">Breadcrumbs — the last item is the current location</div>
  <div className="row">
    <Breadcrumbs items={[{label:'Projects',href:'#'},{label:'Client Portal',href:'#'},{label:'Deployments'}]} />
  </div>
  <div className="sub">SideNav — anchors navigate, the active item is aria-current</div>
  <div className="row" style={{width:'var(--layout-sidebar)'}}>
    <SideNav ariaLabel="Primary" active="deploys" style={{width:'100%'}}
      items={[
        {id:'dashboard',icon:<i className="ph-bold ph-squares-four"/>,label:'Projects',href:'#projects'},
        {id:'deploys',icon:<i className="ph-bold ph-rocket-launch"/>,label:'Deployments',href:'#deploys'},
        {id:'settings',icon:<i className="ph-bold ph-gear-six"/>,label:'Settings'},
      ]} />
  </div>
  <div className="sub">PageHead</div>
  <PageHead title="Client Portal" subtitle="Last published 2 h ago · build #4821"
    actions={<><Button variant="secondary" size="sm">View logs</Button><Button variant="primary" size="sm">Deploy</Button></>} />
  <div className="sub">BulkActionBar — destructive stays outline, never filled</div>
  <div className="row">
    <BulkActionBar count={sel} noun="deployments" onClear={()=>setSel(0)} style={{width:'100%'}}
      actions={[
        {label:'Re-run',icon:<i className="ph-bold ph-arrow-clockwise"/>,onClick:()=>{}},
        {label:'Archive',icon:<i className="ph-bold ph-archive"/>,onClick:()=>{}},
        {label:'Delete',icon:<i className="ph-bold ph-trash"/>,onClick:()=>{},destructive:true},
      ]} />
    {sel===0 && <button onClick={()=>setSel(3)} style={{background:'none',border:'1px solid var(--color-base-300)',borderRadius:'var(--r-sm)',color:'var(--mute)',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',padding:'8px 12px'}}>Restore selection</button>}
  </div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
