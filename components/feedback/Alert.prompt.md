Mensaje persistente en la página (aviso de estado, condición del sistema, contexto). Se queda hasta que la condición se resuelve — a diferencia de `Toast`, que es efímero.

```jsx
<Alert tone="warning" title="Entorno de staging"
  action={{ label:'Ir a producción', onClick:goProd }}>
  Los cambios aquí no afectan a usuarios reales.
</Alert>
```

**Hacer / No hacer**
- Alert = persistente e inline; Toast = efímero y flotante. No los intercambies.
- Si es descartable, el cierre es el icono estándar `ph-x` (H4).
- Reserva `danger` para condiciones que bloquean; para errores de página completa usa `ErrorState`.
