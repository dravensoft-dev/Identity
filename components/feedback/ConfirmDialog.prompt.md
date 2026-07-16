Protege acciones irreversibles (H3, H5). No se cierra al hacer clic fuera. Para lo más destructivo, exige teclear una palabra con `requireText`.

```jsx
<ConfirmDialog open={o} destructive requireText="ELIMINAR"
  title="Eliminar proyecto" confirmLabel="Eliminar definitivamente"
  onCancel={close} onConfirm={remove}>
  Esta acción no se puede deshacer. Se borrarán 4 despliegues y su historial.
</ConfirmDialog>
```