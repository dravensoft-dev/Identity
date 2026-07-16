Modal para confirmaciones y formularios cortos. Overlay con blur.

```jsx
<Dialog open={o} onClose={close} eyebrow="Confirmar" title="Desplegar a producción"
  footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button onClick={go}>Desplegar</Button></>}>
  Esta acción publica el build #4821 para todos los usuarios.
</Dialog>
```