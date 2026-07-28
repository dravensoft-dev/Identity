Arena command palette — the keyboard accelerator behind Cmd/Ctrl+K. Type to filter,
arrow to a command, Enter to run it, Escape to leave, or hover a row to select it.
`hint` is searched but not shown, so a command can be found by a word that is not in
its label. `open` and `commands` are both `input.required` — the host must always bind
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
- Use `hint` for the synonyms people actually type — "logout" for "Sign out".
- Close the palette yourself in your `run` handler if that is what you want; the
  component does not assume it for you.
- Don't put destructive actions in the palette without a confirmation behind them. A
  palette entry is one Enter away from running.
- Don't make the palette the only way to reach something. It is an accelerator, not
  navigation.
- Don't express a condition as an attribute string. `open` carries the
  `booleanAttribute` transform, so a bare `open` and `[open]="true"` both
  mean true, and the one literal string `"false"` means false. Every *other* string is
  true — `"0"`, `"off"` and `"no"` all leave the palette open. Bind the expression
  (`[open]="paletteOpen()"`) rather than relying on the literal.
