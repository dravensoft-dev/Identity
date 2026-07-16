Interruptor para ajustes binarios de efecto inmediato.

```jsx
<Switch checked={dark} onChange={e => setDark(e.target.checked)} label="Tema oscuro" />
```

Para toggles de **alto impacto** (H5) usa `confirm` + `onRequestChange`: el cambio se confirma antes de aplicarse.

```jsx
const [armed, setArmed] = useState(false);
const [pending, setPending] = useState(null); // valor propuesto

<Switch label="Despliegue automático a producción" checked={armed} confirm
  onRequestChange={setPending} onChange={e => setArmed(e.target.checked)} />

<ConfirmDialog open={pending !== null} title="Activar despliegue automático"
  confirmLabel="Activar" onCancel={() => setPending(null)}
  onConfirm={() => { setArmed(pending); setPending(null); }}>
  Cada commit aprobado se desplegará a producción sin revisión manual.
</ConfirmDialog>
```
