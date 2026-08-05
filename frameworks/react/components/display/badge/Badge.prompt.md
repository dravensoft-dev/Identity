Status label in mono uppercase. Short text (1–2 words); if it's longer, it's not a Badge.

```tsx
<Badge tone="success" dot>Deployed</Badge>
<Badge tone="warning">In review</Badge>
```

<!-- @api GENERATED from contracts/api/components/Badge.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `children` | slot |  |  | The label text. Short: a badge is a chip, not a sentence. |
| `tone` | enum | `ArenaTone` | `"neutral"` | System status (success/warning/danger/info) reflects an object's actual state; emphasis (accent, gold) is editorial; neutral carries no semantic weight. |
| `dot` | primitive | `boolean` | `false` | Draws a filled dot in the tone colour before the label. |

<!-- @api end -->

**Tone taxonomy (H4).** Two families, don't mix them:
- **Status**: `success` `warning` `danger` `info`: reflect the actual state of the system (deploy, service, version). The `dot` reinforces "live status".
- **Emphasis**: `accent` (new/featured), `gold` (priority/distinction): editorial, they don't represent status. `neutral` = no semantic weight.

**Don't**
- Don't use `accent` to communicate a status (use a status tone); reserve `accent`'s crimson for "new/featured".
- Don't put full sentences inside a Badge, and don't use `dot` on emphasis tones.
- Don't pass `style` or stray DOM attributes. Badge declares three members (its label content, `tone` and `dot`) and renders nothing else; wrap it in your own element if you need to position it.
