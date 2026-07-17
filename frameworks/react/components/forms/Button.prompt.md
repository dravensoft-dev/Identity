Action button — the main action uses `variant="primary"` (crimson), maximum one per view.

```jsx
<Button variant="primary" onClick={deploy}>Deploy</Button>
<Button variant="secondary" icon={<Icon name="rotate-ccw"/>}>Roll back</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" loading>Deleting…</Button>
```
Variants: primary · secondary · ghost · danger. Sizes sm/md/lg. Props: icon, iconRight, loading, full, disabled.