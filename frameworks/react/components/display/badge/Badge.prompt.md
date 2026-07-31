Status label in mono uppercase. Short text (1–2 words); if it's longer, it's not a Badge.

```jsx
<Badge tone="success" dot>Deployed</Badge>
<Badge tone="warning">In review</Badge>
```

**Tone taxonomy (H4).** Two families, don't mix them:
- **Status**: `success` `warning` `danger` `info`: reflect the actual state of the system (deploy, service, version). The `dot` reinforces "live status".
- **Emphasis**: `accent` (new/featured), `gold` (priority/distinction): editorial, they don't represent status. `neutral` = no semantic weight.

**Don't**
- Don't use `accent` to communicate a status (use a status tone); reserve `accent`'s crimson for "new/featured".
- Don't put full sentences inside a Badge, and don't use `dot` on emphasis tones.
- Don't pass `style` or stray DOM attributes. Badge declares three members (its label content, `tone` and `dot`) and renders nothing else; wrap it in your own element if you need to position it.
