Filter/technology chip, optionally dismissible. The dismiss × uses the standard Phosphor icon `ph-x` (H4) — the same close as Toast.

```jsx
<Tag>TypeScript</Tag>
<Tag onRemove={()=>drop('react')}>React</Tag>
```

**Do / Don't**
- Use `onRemove` only when removing the chip is a real user action (applied filters), not on informational tags.
- Don't mix the Tag/Toast × with the modal close: dialogs close with their explicit button (Cancel), not with the ph-x icon.
