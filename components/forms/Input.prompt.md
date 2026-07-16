Campo de texto con validación (H5). Foco = anillo oro, error = carmesí con icono, válido = verde con check. Requiere las hojas Phosphor cargadas para los iconos de estado.

```jsx
<Input label="Repositorio" required prefix="git@" placeholder="org/proyecto" />
<Input label="Correo" validateOn="change"
  validate={(v) => /.+@.+\..+/.test(v) ? null : 'Formato de correo no válido'} />
<Input label="Slug" valid defaultValue="portal-clientes" hint="Disponible" />
```

Reglas: valida en `blur` por defecto; usa `validateOn="change"` solo para feedback en vivo (contraseñas, disponibilidad). Marca los obligatorios con `required`.
