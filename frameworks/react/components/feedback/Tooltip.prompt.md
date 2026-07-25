Brief tooltip over icons/actions.

```jsx
<Tooltip label="Roll back to the previous build"><IconButton label="Roll back" icon="ph-bold ph-arrow-counter-clockwise" /></Tooltip>
```

`label` is the bubble's text and is required — Arena draws the bubble, the consumer
names it. It is a plain string, so markup inside a tooltip is not possible; a bubble
is a short label, not a paragraph. The children are the element the tooltip describes
and attaches to.

The tooltip is a deferred affordance: it waits for the pointer to rest, and does not
appear for a pointer merely passing over it.

**Don't** wrap a control whose only label is its tooltip. It is unreadable for
`--delay-open`, and it is unreachable by keyboard at all.
