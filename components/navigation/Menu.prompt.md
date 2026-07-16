Actions menu on a trigger (overflow "⋮", more actions, context). Don't confuse with `CommandPalette` (global search ⌘K) or with `Select` (choosing a form value).

```jsx
<Menu align="end" trigger={<IconButton label="More options"><i className="ph-bold ph-dots-three-vertical"/></IconButton>}
  items={[
    { label:'View logs', icon:<i className="ph-bold ph-scroll"/>, onClick:openLogs },
    { label:'Duplicate', icon:<i className="ph-bold ph-copy"/>, onClick:dup, shortcut:'⌘D' },
    { divider:true },
    { label:'Delete', icon:<i className="ph-bold ph-trash"/>, destructive:true, onClick:del },
  ]} />
```

**Do / Don't**
- The trigger must have an accessible name (use `IconButton label`).
- Destructive actions go last and are marked `destructive`.
- To choose a value from a form, use `Select`, not a Menu.
