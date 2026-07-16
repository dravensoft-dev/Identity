Menú de acciones sobre un disparador (desbordamiento «⋮», más acciones, contexto). No confundir con `CommandPalette` (búsqueda global ⌘K) ni con `Select` (elegir un valor de formulario).

```jsx
<Menu align="end" trigger={<IconButton label="Más opciones"><i className="ph-bold ph-dots-three-vertical"/></IconButton>}
  items={[
    { label:'Ver logs', icon:<i className="ph-bold ph-scroll"/>, onClick:openLogs },
    { label:'Duplicar', icon:<i className="ph-bold ph-copy"/>, onClick:dup, shortcut:'⌘D' },
    { divider:true },
    { label:'Eliminar', icon:<i className="ph-bold ph-trash"/>, destructive:true, onClick:del },
  ]} />
```

**Hacer / No hacer**
- El disparador debe tener nombre accesible (usa `IconButton label`).
- Acciones destructivas al final y marcadas `destructive`.
- Para elegir un valor de un formulario, usa `Select`, no un Menu.
