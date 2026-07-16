Placeholder de carga para datos asíncronos (H1). Úsalo en tablas y dashboards mientras llega la respuesta; respeta `prefers-reduced-motion`.

```jsx
{loading
  ? <Skeleton variant="text" lines={4} />
  : <Article data={data} />}

<div style={{display:'flex',gap:12}}>
  <Skeleton variant="circle" height={40} />
  <Skeleton variant="text" lines={2} width={220} />
</div>
```

**Hacer / No hacer**
- Reproduce la forma del contenido real (mismo alto/ancho aproximado) para evitar el salto de layout al cargar.
- No lo dejes indefinidamente: si la carga falla, sustitúyelo por `ErrorState`, no por un skeleton eterno.
