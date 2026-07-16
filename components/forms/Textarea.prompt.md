Entrada de texto de varias líneas. Comparte los estados visuales de `Input`.

```jsx
<Textarea label="Notas del despliegue" rows={5} maxLength={280} counter
  value={notes} onChange={e=>setNotes(e.target.value)}
  hint="Se adjunta al registro de la entrega." />
```

**Hacer / No hacer**
- Multilínea real (descripciones, notas, mensajes). Para una línea usa `Input`.
- Con `maxLength`, activa `counter` para que el límite sea visible.
