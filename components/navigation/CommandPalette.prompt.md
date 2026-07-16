Acelerador para expertos (H7). Ábrela con Cmd/Ctrl+K desde el host y pásale la lista de comandos.

```jsx
const [open, setOpen] = useState(false);
useEffect(() => {
  const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } };
  window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
}, []);
<CommandPalette open={open} onClose={() => setOpen(false)} commands={[
  { label: 'Desplegar a producción', icon: <i className="ph-bold ph-rocket-launch"/>, shortcut: 'D', onRun: deploy },
  { label: 'Revertir último despliegue', icon: <i className="ph-bold ph-arrow-counter-clockwise"/>, onRun: revert },
]} />
```