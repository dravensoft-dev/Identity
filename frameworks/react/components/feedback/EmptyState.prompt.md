Guided empty state (H9/H10). Always give an exit action. `title` is required; `icon` is a
Phosphor class name Arena draws (not a node) — absent renders no glyph at all.

```jsx
<EmptyState icon="ph-duotone ph-folder-open" title="No projects yet"
  message="Create your first project to start deploying." action={<Button>New project</Button>} />
```