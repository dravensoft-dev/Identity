Barra de progreso (H1). Da estado visible a procesos medibles fuera del splash: despliegues, subidas, migraciones. Respeta `prefers-reduced-motion` en el modo indeterminado.

```jsx
<ProgressBar label="Desplegando build #4821" value={64} />
<ProgressBar tone="success" value={100} label="Publicado" />
<ProgressBar indeterminate tone="accent" label="Conectando…" />
```

**Hacer**
- Usar el modo *determinado* siempre que exista un porcentaje real; comunica tiempo restante.
- Alinear `tone` con el estado (success al terminar, danger si falla).

**No hacer**
- No usar `indeterminate` para procesos que sí conoces: degrada la visibilidad (H1).
- No sustituir un Toast de resultado por la barra; la barra informa del progreso, el Toast del desenlace.
