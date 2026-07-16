Selección única entre opciones visibles a la vez. `RadioGroup` mantiene el valor; cada `Radio` declara su `value`.

```jsx
<RadioGroup value={env} onChange={setEnv}>
  <Radio value="prod" label="Producción" hint="Usuarios reales — requiere aprobación" />
  <Radio value="staging" label="Staging" />
  <Radio value="qa" label="QA" />
</RadioGroup>
```

**Hacer / No hacer**
- Usa Radio cuando conviene ver todas las opciones (2–5) y son excluyentes.
- Para más de ~6 opciones o poco espacio, usa `Select`.
- Para activar/desactivar una sola cosa, usa `Switch` o `Checkbox`, no un Radio suelto.
