Brief tooltip over icons/actions.

```jsx
<Tooltip label="Roll back to the previous build"><IconButton label="Roll back" icon="ph-bold ph-arrow-counter-clockwise" /></Tooltip>
```

`label` is the bubble's text and is required — Arena draws the bubble, the consumer
names it. It is a plain string, so markup inside a tooltip is not possible; a bubble
is a short label, not a paragraph. The children are the element the tooltip describes
and attaches to.

The tooltip is a deferred affordance: it waits for the pointer to rest, and does not
appear for a pointer merely passing over it. A focus reveals it immediately instead —
a keyboard user has already paid to reach the control.

**Escape dismisses it from anywhere**, whether a pointer or a focus revealed it, for
as long as the bubble is up. That is WCAG 1.4.13: content shown on hover must be
dismissible without moving the pointer, and a hover leaves focus wherever it already
was, so the key is listened for on the document rather than on the trigger.

**Don't** wrap a control whose only label is its tooltip. A bubble that only
appears on hover or focus, and only after `--delay-open` for a pointer, is a
poor substitute for a name on the control itself.

**Do** hand `Tooltip` a single element that accepts props — that is where
`aria-describedby` lands, added only while the bubble is shown. A description of
your own on that element is **kept**, not replaced: `aria-describedby` is a
space-separated id list, so an input keeps its password rules and gains the bubble
beside them.

```jsx
<Tooltip label="Roll back to the previous build"><IconButton label="Roll back" icon="ph-bold ph-arrow-counter-clockwise" /></Tooltip>
```

**Don't** wrap the trigger in a fragment, hand it a bare string, or wrap it in
a component that swallows its props. The tooltip still shows on hover or
focus, but the description never reaches anyone.

```jsx
<Tooltip label="Roll back to the previous build">
  <>
    <IconButton label="Roll back" icon="ph-bold ph-arrow-counter-clockwise" />
  </>
</Tooltip>
```
