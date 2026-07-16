Estado de error con vía de recuperación (H9). Ofrece Reintentar y, si aplica, Ver logs + el código de diagnóstico.

```jsx
<ErrorState icon={<i className="ph-fill ph-warning-octagon" />} title="No se pudo cargar el panel"
  message="No hay conexión con el servicio de métricas." code="ERR_UPSTREAM_504"
  onRetry={reload} secondaryAction={<Button variant="secondary">Ver logs</Button>} />
```