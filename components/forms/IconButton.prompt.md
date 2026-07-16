Botón solo-icono para toolbars y filas. Siempre pasa `label` (nombre accesible en todos los estados). Donde haya espacio, usa `showLabel` para no depender solo del tooltip de hover (H6).

```jsx
<IconButton label="Más opciones"><i className="ph-bold ph-dots-three-vertical"/></IconButton>
<IconButton variant="solid" showLabel label="Nuevo proyecto"><i className="ph-bold ph-plus"/></IconButton>
```
