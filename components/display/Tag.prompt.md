Chip de filtro/tecnología, opcionalmente descartable. La × de descarte usa el icono estándar Phosphor `ph-x` (H4) — el mismo cierre que Toast.

```jsx
<Tag>TypeScript</Tag>
<Tag onRemove={()=>drop('react')}>React</Tag>
```

**Hacer / No hacer**
- Usa `onRemove` solo cuando quitar el chip es una acción real del usuario (filtros aplicados), no en etiquetas informativas.
- No mezcles la × de Tag/Toast con el cierre de los modales: los diálogos se cierran con su botón explícito (Cancelar), no con el icono ph-x.
