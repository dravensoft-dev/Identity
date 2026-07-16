Notificación efímera. Usa `action` para dar salida al usuario: **Deshacer** tras una acción (H3) o **Reintentar / Ver logs** tras un error (H9). Los toasts de error/crítico llevan **`persist`** para que el host NO los autodescarte (H1); solo se cierran con la × o una acción.

```jsx
<Toast tone="neutral" title="Entrega archivada" action={{ label: 'Deshacer', onClick: undo }} onClose={dismiss} />
<Toast tone="danger" persist title="Fallo en el pipeline" message="tests e2e en checkout" action={{ label: 'Ver logs', onClick: openLogs }} onClose={dismiss} />
```

En el host, respeta `persist`: `if (!toast.persist) setTimeout(dismiss, 4200);`

**Hacer / No hacer**
- `persist` en todo error/crítico; el cierre usa el icono estándar `ph-x` (H4).
- No metas mensajes largos en caja alta ni uses el Toast para confirmaciones destructivas (eso es `ConfirmDialog`).