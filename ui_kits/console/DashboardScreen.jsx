import React from 'react';
import { Shell } from './Shell.jsx';
import { Card } from '../../components/display/Card.jsx';
import { Badge } from '../../components/display/Badge.jsx';
import { Tag } from '../../components/display/Tag.jsx';
import { Button } from '../../components/forms/Button.jsx';
import { Icon } from './Icon.jsx';

const METRICS = [
  { k: 'Proyectos activos', v: '12', tone: 'var(--bone)' },
  { k: 'Despliegues (7d)', v: '48', tone: 'var(--bone)' },
  { k: 'Uptime medio', v: '99.98%', tone: 'var(--success)' },
  { k: 'Incidencias abiertas', v: '2', tone: 'var(--crimson)' },
];
const PROJECTS = [
  { name: 'Portal de clientes', client: 'Aurora Bank', status: ['success', 'Desplegado'], build: '#4821', when: 'hace 2 h', tags: ['React', 'Node', 'AWS'] },
  { name: 'Motor de facturación', client: 'Nébula Retail', status: ['warning', 'En revisión'], build: '#1190', when: 'hace 40 min', tags: ['Go', 'PostgreSQL'] },
  { name: 'App de campo', client: 'Terra Log', status: ['info', 'QA'], build: '#0327', when: 'ayer', tags: ['Flutter', 'gRPC'] },
  { name: 'Pasarela de pagos', client: 'Aurora Bank', status: ['danger', 'Caído'], build: '#0918', when: 'hace 8 min', tags: ['Rust', 'Kafka'] },
  { name: 'Panel analítico', client: 'Vela Media', status: ['success', 'Desplegado'], build: '#2204', when: 'hace 3 h', tags: ['TypeScript', 'ClickHouse'] },
  { name: 'CRM interno', client: 'Dravensoft', status: ['success', 'Desplegado'], build: '#7781', when: 'hace 1 d', tags: ['Next.js'] },
];

export function DashboardScreen({ onNav, onOpenProject }) {
  return (
    <Shell active="dashboard" onNav={onNav} title="Proyectos"
      actions={<Button variant="primary" size="sm" icon={<Icon name="plus" size={16} />}>Nuevo proyecto</Button>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {METRICS.map((m) => (
          <div key={m.k} style={{ background: 'var(--surface-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)' }}>{m.k}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 34, color: m.tone, marginTop: 8 }}>{m.v}</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)' }}>build {p.build}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mute)' }}>{p.when}</span>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Shell>
  );
}
