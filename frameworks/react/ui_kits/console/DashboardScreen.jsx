import React from 'react';
import { Shell } from './Shell.jsx';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tag } from '../../components/display/Tag.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Icon } from './Icon.jsx';

const METRICS = [
  { k: 'Active projects', v: '12', tone: 'var(--bone)' },
  { k: 'Deployments (7d)', v: '48', tone: 'var(--bone)' },
  { k: 'Average uptime', v: '99.98%', tone: 'var(--success)' },
  { k: 'Incidents', v: '2', tone: 'var(--crimson)' },
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
      actions={<Button variant="primary" size="sm" icon={<Icon name="plus" size={16} />}>New project</Button>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {METRICS.map((m) => (
          <div key={m.k} style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-lg)', padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{m.k}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 34, color: m.tone, marginTop: 8 }}>{m.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {PROJECTS.map((p) => (
          <div key={p.name} onClick={() => onOpenProject && onOpenProject(p)} style={{ cursor: 'pointer' }}>
            <Card accent={p.status[0] === 'danger'} style={{ height: '100%' }}
              eyebrow={p.client}
              title={p.name}
              action={<Badge tone={p.status[0]} dot>{p.status[1]}</Badge>}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 16px' }}>
                {p.tags.map((t) => <Tag key={t}>{t}</Tag>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--bw) solid var(--color-base-300)', paddingTop: 14 }}>
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
