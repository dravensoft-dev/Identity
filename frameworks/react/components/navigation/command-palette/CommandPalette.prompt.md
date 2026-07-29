Power-user accelerator (H7). Open it with Cmd/Ctrl+K from the host and pass it the list of
commands. `open` and `commands` are both required — the component throws from its render if
either is absent. Each command's `icon` is a Phosphor class name Arena draws, not a node.
Activating a command emits `onRun` with the command that ran, after `onClose` has already
fired — the host discriminates which command ran by switching on `id`, which is required on
every `Command`.

```jsx
const [open, setOpen] = useState(false);
useEffect(() => {
  const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } };
  window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
}, []);
<CommandPalette open={open} onClose={() => setOpen(false)} commands={[
  { id: 'deploy', label: 'Deploy to production', icon: 'ph-bold ph-rocket-launch', shortcut: 'D' },
  { id: 'revert', label: 'Roll back last deployment', icon: 'ph-bold ph-arrow-counter-clockwise' },
]} onRun={(command) => {
  if (command.id === 'deploy') deploy();
  else if (command.id === 'revert') revert();
}} />
```