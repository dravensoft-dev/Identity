Botón de acción — la acción principal usa `variant="primary"` (carmesí), máximo uno por vista.

```jsx
<Button variant="primary" onClick={deploy}>Desplegar</Button>
<Button variant="secondary" icon={<Icon name="rotate-ccw"/>}>Revertir</Button>
<Button variant="ghost" size="sm">Cancelar</Button>
<Button variant="danger" loading>Eliminando…</Button>
```
Variantes: primary · secondary · ghost · danger. Tamaños sm/md/lg. Props: icon, iconRight, loading, full, disabled.