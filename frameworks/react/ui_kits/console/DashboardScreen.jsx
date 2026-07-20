import React from 'react';
import { Shell } from './Shell.jsx';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tag } from '../../components/display/Tag.jsx';
import { StatCard } from '../../components/display/StatCard.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Icon } from './Icon.jsx';

/* Two of the four carry a tone and two do not, which is the ratio the prop is
 * for: a project count is neither good nor bad, and the color only reads as a
 * signal while most of the row stays uncoloured. Incidents is `danger`, not
 * `accent` — it was --crimson here before StatCard could express state, and
 * crimson is the brand, not a warning. */
const METRICS = [
  { k: 'Active projects', v: '12' },
  { k: 'Deployments (7d)', v: '48' },
  { k: 'Average uptime', v: '99.98%', tone: 'success' },
  { k: 'Incidents', v: '2', tone: 'danger' },
];
const PROJECTS = [
  { name: 'Customer portal', client: 'Aurora Bank', status: ['success', 'Deployed'], build: '#4821', when: '2h ago', tags: ['React', 'Node', 'AWS'] },
  { name: 'Billing engine', client: 'Nebula Retail', status: ['warning', 'In review'], build: '#1190', when: '40 min ago', tags: ['Go', 'PostgreSQL'] },
  { name: 'Field app', client: 'Terra Log', status: ['info', 'QA'], build: '#0327', when: 'yesterday', tags: ['Flutter', 'gRPC'] },
  { name: 'Payment gateway', client: 'Aurora Bank', status: ['danger', 'Down'], build: '#0918', when: '8 min ago', tags: ['Rust', 'Kafka'] },
  { name: 'Analytics dashboard', client: 'Vela Media', status: ['success', 'Deployed'], build: '#2204', when: '3h ago', tags: ['TypeScript', 'ClickHouse'] },
  { name: 'Internal CRM', client: 'Dravensoft', status: ['success', 'Deployed'], build: '#7781', when: '1d ago', tags: ['Next.js'] },
];

export function DashboardScreen({ onNav, onOpenProject }) {
  return (
    <Shell active="dashboard" onNav={onNav} title="Projects"
      actions={<Button variant="primary" size="sm" icon={<Icon name="plus" size="var(--icon-md)" />}>New project</Button>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'calc(var(--sp-1) * 4)', marginBottom: 'calc(var(--sp-1) * 7)' }}>
        {METRICS.map((m) => <StatCard key={m.k} label={m.k} value={m.v} tone={m.tone} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'calc(var(--sp-1) * 4)' }}>
        {PROJECTS.map((p) => (
          <div key={p.name} onClick={() => onOpenProject && onOpenProject(p)} style={{ cursor: 'pointer' }}>
            <Card accent={p.status[0] === 'danger'} style={{ height: '100%' }}
              eyebrow={p.client}
              title={p.name}
              action={<Badge tone={p.status[0]} dot>{p.status[1]}</Badge>}>
              <div style={{ display: 'flex', gap: 'calc(var(--sp-1) * 2)', flexWrap: 'wrap', margin: 'calc(var(--sp-1) * 1) 0 calc(var(--sp-1) * 4)' }}>
                {p.tags.map((t) => <Tag key={t}>{t}</Tag>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--bw) solid var(--color-base-300)', paddingTop: 'calc(var(--sp-1) * 3.5)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--gold)' }}>build {p.build}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{p.when}</span>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Shell>
  );
}
