Power-user accelerator (H7). Open it with Cmd/Ctrl+K from the host and pass it the list of commands.

```jsx
const [open, setOpen] = useState(false);
useEffect(() => {
  const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } };
  window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
}, []);
<CommandPalette open={open} onClose={() => setOpen(false)} commands={[
  { label: 'Deploy to production', icon: <i className="ph-bold ph-rocket-launch"/>, shortcut: 'D', onRun: deploy },
  { label: 'Roll back last deployment', icon: <i className="ph-bold ph-arrow-counter-clockwise"/>, onRun: revert },
]} />
```