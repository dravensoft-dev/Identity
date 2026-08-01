Base container. Use `eyebrow` (crimson mono) + `title` (Archivo) for the header.

```tsx
<Card eyebrow="Delivery" title="Client Portal" action={<Badge tone="success">Deployed</Badge>}>
  …
</Card>
```

**Don't**
- Don't pass `style` or stray DOM attributes. Card declares its `content` and `action` slots plus `title`, `eyebrow`, `floating` and `accent`, and renders nothing else. To size, constrain or shadow a card differently, wrap it in your own element (a fixed-width `<div>`, a `maxWidth` box) rather than reaching through the card.