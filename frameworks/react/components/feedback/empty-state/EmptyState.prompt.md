Guided empty state (H9/H10). Always give an exit action. `title` is required; `icon` is a
Phosphor class name Arena draws (not a node); absent renders no glyph at all.

```tsx
<EmptyState icon="ph-duotone ph-folder-open" title="No projects yet"
  message="Create your first project to start deploying." action={<Button>New project</Button>} />
```

<!-- @api GENERATED from contracts/api/components/EmptyState.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `icon` | primitive | `string` |  | A Phosphor class name for the glyph Arena draws, muted. |
| `title*` | primitive | `string` |  | The headline: what is empty. |
| `message` | primitive | `string` |  | A sentence of guidance under the title. |
| `action` | slot |  |  | A single call-to-action control, centred under the message. |

<!-- @api end -->