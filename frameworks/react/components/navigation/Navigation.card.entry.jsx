import React from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs } from './tabs/Tabs.jsx';
import { Tab } from './tab/Tab.jsx';
import { SegmentedControl } from './segmented-control/SegmentedControl.jsx';
import { PageHead } from './page-head/PageHead.jsx';
import { Breadcrumbs } from './breadcrumbs/Breadcrumbs.jsx';
import { SideNav } from './side-nav/SideNav.jsx';
import { SideNavItem } from './side-nav-item/SideNavItem.jsx';
import { SideNavSection } from './side-nav-section/SideNavSection.jsx';
import { SideNavCollapsible } from './side-nav-collapsible/SideNavCollapsible.jsx';
import { BulkActionBar } from './bulk-action-bar/BulkActionBar.jsx';
import { Button } from '../forms/button/Button.jsx';
function Demo(){const[v,setV]=React.useState('Overview');const[range,setRange]=React.useState('7d');const[sel,setSel]=React.useState(3);return(<div>
  <Tabs value={v} onChange={setV}>
    <Tab value="Overview" label="Overview">
      <div style={{color:'var(--bone-dim)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>Uptime 99.98% · p95 186 ms · 0 open incidents.</div>
    </Tab>
    <Tab value="Deployments" label="Deployments">
      <div style={{fontFamily:'var(--font-mono)',fontSize:'var(--dz-text-sm)',color:'var(--mute)'}}>#4821 → Production · CI · main · 3m 41s</div>
    </Tab>
    <Tab value="Activity" label="Activity">
      <div style={{color:'var(--bone-dim)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>ana@ approved the release · 2h ago</div>
    </Tab>
    <Tab value="Settings" label="Settings">
      <div style={{color:'var(--bone-dim)',fontSize:'var(--dz-text)',lineHeight:'var(--lh-body)'}}>Auto-deploy on approval — enabled.</div>
    </Tab>
  </Tabs>
  <div className="row" style={{marginTop:'calc(var(--sp-1) * 3.5)'}}>
    <div className="sub">SegmentedControl — filters inside the tab, never navigates</div>
    <SegmentedControl ariaLabel="Time range" options={[{value:'24h',label:'24h'},{value:'7d',label:'7d'},{value:'30d',label:'30d'}]} value={range} onChange={setRange}/>
    <span style={{color:'var(--mute)',fontFamily:'var(--font-mono)',fontSize:'var(--dz-text-sm)'}}>Active view: <span style={{color:'var(--gold)'}}>{v}</span> · Range: <span style={{color:'var(--gold)'}}>{range}</span></span>
  </div>
  <div className="sub">Breadcrumbs — the last item is the current location</div>
  <div className="row">
    <Breadcrumbs ariaLabel="Project navigation" items={[{label:'Projects',href:'#'},{label:'Client Portal',href:'#'},{label:'Deployments'}]} />
  </div>
  <div className="sub">SideNav — sections group, collapsibles disclose, the active item is aria-current</div>
  {

}
  <div style={{width:'var(--layout-sidebar)',marginBottom:'var(--sp-4)'}}>
    {

}
    <SideNav ariaLabel="Primary" active="prod">
      <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="#projects"/>
      <SideNavSection label="Workspace">
        <SideNavCollapsible id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments">
          <SideNavItem id="prod" label="Production" href="#prod"/>
          <SideNavItem id="staging" label="Staging" href="#staging"/>
        </SideNavCollapsible>
        <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings"/>
      </SideNavSection>
    </SideNav>
  </div>
  <div className="sub">PageHead</div>
  <div style={{marginBottom:'var(--sp-4)'}}>
    <PageHead title="Client Portal" subtitle="Last published 2 h ago · build #4821"
      actions={<><Button variant="secondary" size="sm">View logs</Button><Button variant="primary" size="sm">Deploy</Button></>} />
  </div>
  <div className="sub">BulkActionBar — destructive stays outline, never filled</div>
  <div className="row" style={{width:'100%'}}>
    <BulkActionBar count={sel} noun="deployments" onClear={()=>setSel(0)} onRun={()=>{}}
      actions={[
        {id:'rerun',label:'Re-run',icon:'ph-bold ph-arrow-clockwise'},
        {id:'archive',label:'Archive',icon:'ph-bold ph-archive'},
        {id:'delete',label:'Delete',icon:'ph-bold ph-trash',destructive:true},
      ]} />
    {sel===0 && <button onClick={()=>setSel(3)} style={{background:'none',border:'var(--bw) solid var(--color-base-300)',borderRadius:'var(--r-sm)',color:'var(--mute)',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:'var(--dz-text-xs)',letterSpacing:'var(--ls-badge)',textTransform:'uppercase',padding:'var(--sp-2) var(--sp-3)'}}>Restore selection</button>}
  </div>
</div>);}
createRoot(document.getElementById('root')).render(<Demo/>);
