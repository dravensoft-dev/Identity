import React from 'react';
import type { Tone } from '../../Api.generated';
import { Shell } from './Shell.tsx';
import { Card } from '../../components/display/card/Card.tsx';
import { Badge } from '../../components/display/badge/Badge.tsx';
import { Tag } from '../../components/display/tag/Tag.tsx';
import { StatCard } from '../../components/display/stat-card/StatCard.tsx';
import { Button } from '../../components/forms/button/Button.tsx';

const METRICS: { k: string; v: string; tone?: Tone }[] = [
  { k: 'Active projects', v: '12' },
  { k: 'Deployments (7d)', v: '48' },
  { k: 'Average uptime', v: '99.98%', tone: 'success' },
  { k: 'Incidents', v: '2', tone: 'danger' },
];
export interface ConsoleProject {
  name: string;
  client: string;
  status: [Tone, string];
  build: string;
  when: string;
  tags: string[];
}

const PROJECTS: ConsoleProject[] = [
  { name: 'Customer portal', client: 'Aurora Bank', status: ['success', 'Deployed'], build: '#4821', when: '2h ago', tags: ['React', 'Node', 'AWS'] },
  { name: 'Billing engine', client: 'Nebula Retail', status: ['warning', 'In review'], build: '#1190', when: '40 min ago', tags: ['Go', 'PostgreSQL'] },
  { name: 'Field app', client: 'Terra Log', status: ['info', 'QA'], build: '#0327', when: 'yesterday', tags: ['Flutter', 'gRPC'] },
  { name: 'Payment gateway', client: 'Aurora Bank', status: ['danger', 'Down'], build: '#0918', when: '8 min ago', tags: ['Rust', 'Kafka'] },
  { name: 'Analytics dashboard', client: 'Vela Media', status: ['success', 'Deployed'], build: '#2204', when: '3h ago', tags: ['TypeScript', 'ClickHouse'] },
  { name: 'Internal CRM', client: 'Dravensoft', status: ['success', 'Deployed'], build: '#7781', when: '1d ago', tags: ['Next.js'] },
];

export interface DashboardScreenProps {
  onNav?: (id: string) => void;
  onOpenProject?: (project: ConsoleProject) => void;
}

export function DashboardScreen({ onNav, onOpenProject }: DashboardScreenProps) {
  return (
    <Shell active="dashboard" onNav={onNav} title="Projects"
      actions={<Button variant="primary" size="sm" icon="ph-bold ph-plus">New project</Button>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'calc(var(--sp-1) * 4)', marginBottom: 'calc(var(--sp-1) * 7)' }}>
        {METRICS.map((m) => <StatCard key={m.k} label={m.k} value={m.v} tone={m.tone} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'calc(var(--sp-1) * 4)' }}>
        {PROJECTS.map((p) => (
          <div key={p.name} onClick={() => onOpenProject && onOpenProject(p)} style={{ cursor: 'pointer', display: 'grid' }}>
            <Card accent={p.status[0] === 'danger'}
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
