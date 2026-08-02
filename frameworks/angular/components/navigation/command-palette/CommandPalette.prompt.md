Arena command palette, the keyboard accelerator behind Cmd/Ctrl+K. Type to filter,
arrow to a command, Enter to run it, Escape to leave, or hover a row to select it.
`hint` is searched but not shown, so a command can be found by a word that is not in
its label. `open` and `commands` are both `input.required`; the host must always bind
both. Each command's `icon` is a Phosphor class name Arena draws, not projected content.
The host owns `open` and the shortcut that sets it, and decides whether running a
command also closes the palette. The search field is an ARIA 1.2 combobox
wired to the row list as its listbox popup, so a screen reader announces which row is
active as you arrow through it.

```html
<arena-command-palette [open]="paletteOpen()" [commands]="commands"
                       (close)="paletteOpen.set(false)"
                       (run)="paletteOpen.set(false); dispatch($event)" />
```

**Do / Don't**
- Put every command's real shortcut in `shortcut`. The palette is where people learn
  the shortcuts that let them stop using the palette.
- Use `hint` for the synonyms people actually type: "logout" for "Sign out".
- Close the palette yourself in your `run` handler if that is what you want; the
  component does not assume it for you.
- Don't put destructive actions in the palette without a confirmation behind them. A
  palette entry is one Enter away from running.
- Don't make the palette the only way to reach something. It is an accelerator, not
  navigation.
- Don't express a condition as an attribute string. `open` carries the
  `booleanAttribute` transform, so a bare `open` and `[open]="true"` both
  mean true, and the one literal string `"false"` means false. Every *other* string is
  true, `"0"`, `"off"` and `"no"` all leave the palette open. Bind the expression
  (`[open]="paletteOpen()"`) rather than relying on the literal.

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
`(run)`, so a host that navigates in its `(run)` handler navigates exactly once, whichever way
the reader activated the row. Ctrl-click, meta-click, shift-click and a middle click are the
browser's: they open the destination themselves, fire nothing, and leave the palette open,
because a reader who asked for a second tab did not ask to leave this one.

There is no `maxResults`. Trimming the list before passing it throws away matches the query
would have found, and a better ranking is an improvement inside the component rather than a
member; a scoring function would be a `functionInput` in a contract that declares no
`kind: "input"`.
