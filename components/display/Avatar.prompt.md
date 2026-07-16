Identidad visual de una persona o entidad. Con `src` muestra la imagen; sin ella, iniciales del `name`.

```jsx
<Avatar name="Lucía Fernández" status="online" />
<Avatar src="/u/marco.jpg" name="Marco Ruiz" size="lg" />
<Avatar name="Aurora Bank" shape="rounded" />  {/* entidad/equipo */}
```

**Hacer / No hacer**
- `circle` para personas, `rounded` para equipos/organizaciones.
- Pasa siempre `name` (nombre accesible + iniciales de reserva), aunque haya `src`.
- Es el único elemento, con los switches, que puede ser completamente redondo.
