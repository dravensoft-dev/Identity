Etiqueta de estado en mono mayúsculas. Texto corto (1–2 palabras); si es más largo, no es un Badge.

```jsx
<Badge tone="success" dot>Desplegado</Badge>
<Badge tone="warning">En revisión</Badge>
```

**Taxonomía de tonos (H4).** Dos familias, no las mezcles:
- **Estado** — `success` `warning` `danger` `info`: reflejan el estado real del sistema (deploy, servicio, versión). El `dot` refuerza «estado en vivo».
- **Énfasis** — `accent` (novedad/destacado), `gold` (prioridad/distinción): editoriales, no representan estado. `neutral` = sin carga semántica.

**No hacer**
- No uses `accent` para comunicar un estado (usa un tono de estado); reserva el carmesí de `accent` para «nuevo/destacado».
- No pongas frases dentro de un Badge ni `dot` en tonos de énfasis.
