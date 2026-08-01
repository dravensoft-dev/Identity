import type { Tone, TableColumn } from '../../Api.generated';
import type { ConsoleProject } from './DashboardScreen.tsx';
import React, { useState } from 'react';
import { Shell } from './Shell.tsx';
import { Card } from '../../components/display/card/Card.tsx';
import { Badge } from '../../components/display/badge/Badge.tsx';
import { Tag } from '../../components/display/tag/Tag.tsx';
import { Table } from '../../components/display/table/Table.tsx';
import { TableRow } from '../../components/display/table-row/TableRow.tsx';
import { TableCell } from '../../components/display/table-cell/TableCell.tsx';
import { ActivityFeed } from '../../components/display/activity-feed/ActivityFeed.tsx';
import { Tabs } from '../../components/navigation/tabs/Tabs.tsx';
import { Tab } from '../../components/navigation/tab/Tab.tsx';
import { Button } from '../../components/forms/button/Button.tsx';
import { Switch } from '../../components/forms/switch/Switch.tsx';
import { Dialog } from '../../components/feedback/dialog/Dialog.tsx';

const DEPLOYS: { build: string; env: string; status: [Tone, string]; author: string; dur: string }[] = [
  { build: '#4821', env: 'Production', status: ['success', 'Active'], author: 'CI · main', dur: '3m 41s' },
  { build: '#4820', env: 'Staging', status: ['success', 'OK'], author: 'ana@', dur: '3m 12s' },
  { build: '#4818', env: 'Production', status: ['neutral', 'Rolled back'], author: 'CI · main', dur: '4m 02s' },
  { build: '#4815', env: 'QA', status: ['danger', 'Failed'], author: 'diego@', dur: '1m 08s' },
];

const DEPLOY_COLUMNS: TableColumn[] = [
  { header: 'Build', mono: true, width: 'calc(var(--sp-1) * 24)' },
  { header: 'Environment' },
  { header: 'Status' },
  { header: 'Author' },
  { header: 'Duration', mono: true },

  { header: '', mobileLayout: 'block' },
];
const ACTIVITY = [
  { id: '1', actor: 'ana@', action: 'approved the release', target: 'build #4821', time: '2h ago' },
  { id: '2', actor: 'CI', action: 'deployed to production', target: 'build #4821', time: '2h ago' },
  { id: '3', actor: 'diego@', action: 'opened incident', target: 'checkout latency', time: '3h ago' },
  { id: '4', actor: 'nora@', action: 'merged', target: 'PR #338 · session cache', time: '5h ago' },
];

export interface ProjectScreenProps {
  onNav?: (id: string) => void;
  project?: ConsoleProject | null;
  onToast?: () => void;
}

export function ProjectScreen({ onNav, project, onToast }: ProjectScreenProps) {
  const p = project || { name: 'Customer portal', client: 'Aurora Bank', tags: ['React', 'Node', 'AWS'] };
  const [tab, setTab] = useState('Deployments');
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(true);

  const deploy = () => { setOpen(false); onToast && onToast(); };

  return (
    <Shell active="dashboard" onNav={onNav} title={p.name}
      actions={<Button variant="primary" size="sm" icon="ph-bold ph-rocket-launch" onClick={() => setOpen(true)}>Deploy</Button>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)', marginBottom: 'calc(var(--sp-1) * 5)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{p.client}</span>
        <Badge tone="success" dot>Deployed</Badge>
        {(p.tags || []).map((t: string) => <Tag key={t}>{t}</Tag>)}
      </div>
      <Tabs value={tab} onChange={setTab}>
        <Tab value="Overview" label="Overview">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'calc(var(--sp-1) * 4)' }}>
            <Card eyebrow="Status" title="Service health">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'calc(var(--sp-1) * 4)' }}>
                {[['Uptime', '99.98%', 'var(--success)'], ['p95', '186 ms', 'var(--bone)'], ['Errors', '0.02%', 'var(--gold)']].map(([k, v, c]) => (
                  <div key={k}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{k}</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-h3)', color: c, marginTop: 'calc(var(--sp-1) * 1.5)' }}>{v}</div></div>
                ))}
              </div>
            </Card>
            <Card eyebrow="Delivery" title="Next milestone">
              <div style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)', lineHeight: 'var(--lh-body)' }}>Release 2.5 — SEPA gateway.</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--gold)', marginTop: 'calc(var(--sp-1) * 2.5)' }}>in 6 days</div>
            </Card>
          </div>
        </Tab>
        <Tab value="Deployments" label="Deployments">
          <Table columns={DEPLOY_COLUMNS} label="Deployments">
            {
}
            {DEPLOYS.map((d) => (
              <TableRow key={d.build}>
                <TableCell>{d.build}</TableCell>
                <TableCell>{d.env}</TableCell>
                <TableCell><Badge tone={d.status[0]} dot>{d.status[1]}</Badge></TableCell>
                <TableCell>{d.author}</TableCell>
                <TableCell>{d.dur}</TableCell>
                <TableCell><Button variant="ghost" size="sm">Details</Button></TableCell>
              </TableRow>
            ))}
          </Table>
        </Tab>
        <Tab value="Activity" label="Activity">
          <Card><ActivityFeed label="Project activity" items={ACTIVITY} /></Card>
        </Tab>
        <Tab value="Settings" label="Settings">
          <div style={{ maxWidth: 'calc(var(--sp-1) * 130)' }}>
            <Card title="Automation">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4.5)' }}>
                <Switch state={auto} onFuncOn={() => setAuto(true)} onFuncOff={() => setAuto(false)} label="Auto-deploy on approval" />
                <Switch state={false} label="Notify Slack on every release" />
                <Switch state label="Require 2 approvals for production" />
              </div>
            </Card>
          </div>
        </Tab>
      </Tabs>

      <Dialog open={open} onClose={() => setOpen(false)} eyebrow="Confirm" title="Deploy to production"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" icon="ph-bold ph-rocket-launch" onClick={deploy}>Deploy #4822</Button></>}>
        You'll publish build <b style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>#4822</b> of <b style={{ color: 'var(--bone)' }}>{p.name}</b> to all {p.client} users. You can roll back at any time.
      </Dialog>
    </Shell>
  );
}
