Brief tooltip over icons/actions.

```jsx
<Tooltip content="Roll back to the previous build"><IconButton label="Roll back">…</IconButton></Tooltip>
```

The tooltip is a deferred affordance: it waits for the pointer to rest, and does not
appear for a pointer merely passing over it.

**Don't** wrap a control whose only label is its tooltip. It is unreadable for
`--delay-open`, and it is unreachable by keyboard at all.