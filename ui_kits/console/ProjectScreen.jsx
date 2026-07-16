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
  { build: '#4821', env: 'Producción', status: ['success', 'Activo'], when: 'hace 2 h', author: 'CI · main', dur: '3m 41s' },
  { build: '#4820', env: 'Staging', status: ['success', 'OK'], when: 'hace 5 h', author: 'ana@', dur: '3m 12s' },
  { build: '#4818', env: 'Producción', status: ['neutral', 'Revertido'], when: 'ayer', author: 'CI · main', dur: '4m 02s' },
  { build: '#4815', env: 'QA', status: ['danger', 'Fallido'], when: 'ayer', author: 'diego@', dur: '1m 08s' },
];
const ACTIVITY = [
  ['ana@', 'aprobó la entrega', 'build #4821', 'hace 2 h'],
  ['CI', 'desplegó a producción', 'build #4821', 'hace 2 h'],
  ['diego@', 'abrió incidencia', 'latencia en checkout', 'hace 3 h'],
  ['nora@', 'fusionó', 'PR #338 · caché de sesión', 'hace 5 h'],
];

export function ProjectScreen({ onNav, project, onToast }) {
  const p = project || { name: 'Portal de clientes', client: 'Aurora Bank', tags: ['React', 'Node', 'AWS'] };
  const [tab, setTab] = useState('Despliegues');
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(true);

  const deploy = () => { setOpen(false); onToast && onToast(); };

  return (
    <Shell active="dashboard" onNav={onNav} title={p.name}
      actions={<Button variant="primary" size="sm" icon={<Icon name="rocket" size={16} />} onClick={() => setOpen(true)}>Desplegar</Button>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)' }}>{p.client}</span>
        <Badge tone="success" dot>Desplegado</Badge>
        {(p.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
      <Tabs tabs={['Resumen', 'Despliegues', 'Actividad', 'Ajustes']} value={tab} onChange={setTab} style={{ marginBottom: 22 }} />

      {tab === 'Despliegues' && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '12px 20px', background: 'var(--panel)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)' }}>
            <span>Build</span><span>Entorno</span><span>Estado</span><span>Autor</span><span>Duración</span><span></span>
          </div>
          {DEPLOYS.map((d, i) => (
            <div key={d.build} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '16px 20px', alignItems: 'center', background: 'var(--surface-card)', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)' }}>{d.build}</span>
              <span style={{ fontSize: 14, color: 'var(--bone-dim)' }}>{d.env}</span>
              <span><Badge tone={d.status[0]} dot>{d.status[1]}</Badge></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--mute)' }}>{d.author}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--mute)' }}>{d.dur}</span>
              <Button variant="ghost" size="sm">Detalles</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'Actividad' && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crimson)' }} />
                <span style={{ fontSize: 14, color: 'var(--bone-dim)' }}><b style={{ color: 'var(--bone)' }}>{a[0]}</b> {a[1]} <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{a[2]}</span></span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mute)' }}>{a[3]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Resumen' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card eyebrow="Estado" title="Salud del servicio">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[['Uptime', '99.98%', 'var(--success)'], ['p95', '186 ms', 'var(--bone)'], ['Errores', '0.02%', 'var(--gold)']].map(([k, v, c]) => (
                <div key={k}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)' }}>{k}</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: c, marginTop: 6 }}>{v}</div></div>
              ))}
            </div>
          </Card>
          <Card eyebrow="Entrega" title="Próximo hito">
            <div style={{ fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.6 }}>Release 2.5 — pasarela SEPA.</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', marginTop: 10 }}>en 6 días</div>
          </Card>
        </div>
      )}

      {tab === 'Ajustes' && (
        <Card title="Automatización" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Switch checked={auto} onChange={(e) => setAuto(e.target.checked)} label="Despliegue automático al aprobar" />
            <Switch checked={false} onChange={() => {}} label="Notificar a Slack en cada release" />
            <Switch checked label="Requerir 2 aprobaciones para producción" />
          </div>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} eyebrow="Confirmar" title="Desplegar a producción"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="primary" icon={<Icon name="rocket" size={16} />} onClick={deploy}>Desplegar #4822</Button></>}>
        Publicarás el build <b style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>#4822</b> de <b style={{ color: 'var(--bone)' }}>{p.name}</b> para todos los usuarios de {p.client}. Puedes revertir en cualquier momento.
      </Dialog>
    </Shell>
  );
}
