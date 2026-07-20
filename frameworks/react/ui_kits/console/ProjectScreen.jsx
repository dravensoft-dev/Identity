import React, { useState } from 'react';
import { Shell } from './Shell.jsx';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tag } from '../../components/display/Tag.jsx';
import { Table } from '../../components/display/Table.jsx';
import { Tabs } from '../../components/navigation/Tabs.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Switch } from '../../components/forms/Switch.jsx';
import { Dialog } from '../../components/feedback/Dialog.jsx';
import { Icon } from './Icon.jsx';

const DEPLOYS = [
  { build: '#4821', env: 'Production', status: ['success', 'Active'], when: '2h ago', author: 'CI · main', dur: '3m 41s' },
  { build: '#4820', env: 'Staging', status: ['success', 'OK'], when: '5h ago', author: 'ana@', dur: '3m 12s' },
  { build: '#4818', env: 'Production', status: ['neutral', 'Rolled back'], when: 'yesterday', author: 'CI · main', dur: '4m 02s' },
  { build: '#4815', env: 'QA', status: ['danger', 'Failed'], when: 'yesterday', author: 'diego@', dur: '1m 08s' },
];
/* Deployments reads Table rather than a hand-rolled grid. It used to be six
 * spans per row inside their own `display:grid`, one container per row — and
 * grid sizes its columns per container, never across siblings. The header's
 * trailing `auto` column held an empty span and each body row's held a
 * button, so the header's five `1fr` columns split ~75px more free space than
 * the body's did and every label drifted right of its data, cumulatively. A
 * <table> shares column widths by definition, so the bug cannot come back.
 *
 * `mono` is the component's rule for identifiers and numeric data, and it
 * carries --gold: the build number and the duration take it, the author does
 * not — a name is neither a code nor a measurement. */
const DEPLOY_COLUMNS = [
  { key: 'build', header: 'Build', mono: true, width: 'calc(var(--sp-1) * 24)' },
  { key: 'env', header: 'Environment' },
  { key: 'status', header: 'Status', render: (s) => <Badge tone={s[0]} dot>{s[1]}</Badge> },
  { key: 'author', header: 'Author' },
  { key: 'dur', header: 'Duration', mono: true },
  /* No header: the button names itself, and an "ACTIONS" label above it would
     say less than the button does. mobileLayout:'block' drops the label row
     entirely when the table collapses to cards. */
  { key: 'actions', header: '', mobileLayout: 'block', render: () => <Button variant="ghost" size="sm">Details</Button> },
];
const ACTIVITY = [
  ['ana@', 'approved the release', 'build #4821', '2h ago'],
  ['CI', 'deployed to production', 'build #4821', '2h ago'],
  ['diego@', 'opened incident', 'checkout latency', '3h ago'],
  ['nora@', 'merged', 'PR #338 · session cache', '5h ago'],
];

export function ProjectScreen({ onNav, project, onToast }) {
  const p = project || { name: 'Customer portal', client: 'Aurora Bank', tags: ['React', 'Node', 'AWS'] };
  const [tab, setTab] = useState('Deployments');
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(true);

  const deploy = () => { setOpen(false); onToast && onToast(); };

  return (
    <Shell active="dashboard" onNav={onNav} title={p.name}
      actions={<Button variant="primary" size="sm" icon={<Icon name="rocket" size="var(--icon-md)" />} onClick={() => setOpen(true)}>Deploy</Button>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)', marginBottom: 'calc(var(--sp-1) * 5)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{p.client}</span>
        <Badge tone="success" dot>Deployed</Badge>
        {(p.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
      <Tabs tabs={['Overview', 'Deployments', 'Activity', 'Settings']} value={tab} onChange={setTab} style={{ marginBottom: 'calc(var(--sp-1) * 5.5)' }} />

      {tab === 'Deployments' && (
        <Table columns={DEPLOY_COLUMNS} rows={DEPLOYS} getRowKey={(d) => d.build} />
      )}

      {tab === 'Activity' && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 'calc(var(--sp-1) * 3)', alignItems: 'center', padding: 'calc(var(--sp-1) * 3.5) 0', borderTop: i ? 'var(--bw) solid var(--color-base-300)' : 'none' }}>
                <span style={{ width: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 2)', borderRadius: '50%', background: 'var(--crimson)' }} />
                <span style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}><b style={{ color: 'var(--bone)' }}>{a[0]}</b> {a[1]} <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)' }}>{a[2]}</span></span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{a[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Overview' && (
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
      )}

      {tab === 'Settings' && (
        <Card title="Automation" style={{ maxWidth: 'calc(var(--sp-1) * 130)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4.5)' }}>
            <Switch checked={auto} onChange={(e) => setAuto(e.target.checked)} label="Auto-deploy on approval" />
            <Switch checked={false} onChange={() => {}} label="Notify Slack on every release" />
            <Switch checked label="Require 2 approvals for production" />
          </div>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} eyebrow="Confirm" title="Deploy to production"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" icon={<Icon name="rocket" size="var(--icon-md)" />} onClick={deploy}>Deploy #4822</Button></>}>
        You'll publish build <b style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>#4822</b> of <b style={{ color: 'var(--bone)' }}>{p.name}</b> to all {p.client} users. You can roll back at any time.
      </Dialog>
    </Shell>
  );
}
