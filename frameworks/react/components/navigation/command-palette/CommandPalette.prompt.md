Power-user accelerator (H7). Open it with Cmd/Ctrl+K from the host and pass it the list of
commands. `open` and `commands` are both required; the component throws from its render if
either is absent. Each command's `icon` is a Phosphor class name Arena draws, not a node.
Activating a command emits `onRun` with the command that ran, after `onClose` has already
fired, the host discriminates which command ran by switching on `id`, which is required on
every `Command`.

```tsx
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

### Groups and routes

`group` heads a command's section. Commands with no group list first and ungrouped, then each
group in the order its first command appears, so a palette built by concatenating four
collections gets its headings back without the caller reordering anything. The heading is
drawn and also announced as the group's name, so it carries `aria-hidden` on the visible copy
rather than being read twice.

`route` says where running a command goes. With it the row renders an `<a href>`, so
ctrl-click, middle-click and open-in-new-tab work, which is what an accelerator over a list of
destinations owes a keyboard user. It keeps `role="option"`, because the listbox pattern
requires that of every row and losing it would break the arrow walk for the whole list: a
screen reader announces the row as an option rather than as a link, and that is the trade.

**With `route`, the mouse and the keyboard do the same thing, and that is the point.** A
primary click with no modifier and Enter both cancel the row's anchor and report through
`onRun`, so a host that navigates in its `onRun` handler navigates exactly once, whichever way
the reader activated the row. Ctrl-click, meta-click, shift-click and a middle click are the
browser's: they open the destination themselves, fire nothing, and leave the palette open,
because a reader who asked for a second tab did not ask to leave this one.

There is no `maxResults`. Trimming the list before passing it throws away matches the query
would have found, and a better ranking is an improvement inside the component rather than a
member; a scoring function would be a `functionInput` in a contract that declares no
`kind: "input"`.
