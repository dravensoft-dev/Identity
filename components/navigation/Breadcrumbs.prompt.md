Migas de navegación (H3). Da una vía de retorno explícita cuando la jerarquía es más profunda que las pestañas. El último ítem es la página actual (no enlazado).

```jsx
<Breadcrumbs items={[
  { label: 'Proyectos', onClick: goProjects },
  { label: 'Checkout', onClick: goProject },
  { label: 'Despliegue #482' },
]} />
```

**Hacer / No hacer**
- El último ítem es la ubicación actual: sin enlace y en `--bone`.
- No sustituyas las pestañas por migas ni al revés; conviven (pestañas = secciones hermanas, migas = profundidad).
