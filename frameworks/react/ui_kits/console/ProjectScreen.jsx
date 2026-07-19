import React, { useState } from 'react';
import { Shell } from './Shell.jsx';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tag } from '../../components/display/Tag.jsx';
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
      actions={<Button variant="primary" size="sm" icon={<Icon name="rocket" size={16} />} onClick={() => setOpen(true)}>Deploy</Button>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{p.client}</span>
        <Badge tone="success" dot>Deployed</Badge>
        {(p.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
      <Tabs tabs={['Overview', 'Deployments', 'Activity', 'Settings']} value={tab} onChange={setTab} style={{ marginBottom: 22 }} />

      {tab === 'Deployments' && (
        <div style={{ border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '12px 20px', background: 'var(--panel)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-column-header)', textTransform: 'uppercase', color: 'var(--mute)' }}>
            <span>Build</span><span>Environment</span><span>Status</span><span>Author</span><span>Duration</span><span></span>
          </div>
          {DEPLOYS.map((d, i) => (
            <div key={d.build} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '16px 20px', alignItems: 'center', background: 'var(--surface-card)', borderTop: i ? '1px solid var(--color-base-300)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--gold)' }}>{d.build}</span>
              <span style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}>{d.env}</span>
              <span><Badge tone={d.status[0]} dot>{d.status[1]}</Badge></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>{d.author}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>{d.dur}</span>
              <Button variant="ghost" size="sm">Details</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'Activity' && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 0', borderTop: i ? '1px solid var(--color-base-300)' : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crimson)' }} />
                <span style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}><b style={{ color: 'var(--bone)' }}>{a[0]}</b> {a[1]} <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)' }}>{a[2]}</span></span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{a[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card eyebrow="Status" title="Service health">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[['Uptime', '99.98%', 'var(--success)'], ['p95', '186 ms', 'var(--bone)'], ['Errors', '0.02%', 'var(--gold)']].map(([k, v, c]) => (
                <div key={k}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{k}</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 28, color: c, marginTop: 6 }}>{v}</div></div>
              ))}
            </div>
          </Card>
          <Card eyebrow="Delivery" title="Next milestone">
            <div style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)', lineHeight: 'var(--lh-body)' }}>Release 2.5 — SEPA gateway.</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--gold)', marginTop: 10 }}>in 6 days</div>
          </Card>
        </div>
      )}

      {tab === 'Settings' && (
        <Card title="Automation" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Switch checked={auto} onChange={(e) => setAuto(e.target.checked)} label="Auto-deploy on approval" />
            <Switch checked={false} onChange={() => {}} label="Notify Slack on every release" />
            <Switch checked label="Require 2 approvals for production" />
          </div>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} eyebrow="Confirm" title="Deploy to production"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" icon={<Icon name="rocket" size={16} />} onClick={deploy}>Deploy #4822</Button></>}>
        You'll publish build <b style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>#4822</b> of <b style={{ color: 'var(--bone)' }}>{p.name}</b> to all {p.client} users. You can roll back at any time.
      </Dialog>
    </Shell>
  );
}
