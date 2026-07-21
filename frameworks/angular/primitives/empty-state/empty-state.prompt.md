Arena empty state — a section or screen with nothing in it yet, and one clear way
forward. The action is projected, so it is a real `mat-button` wearing Arena rather
than a second button implementation. The dashed border is what distinguishes it from
`arena-error-state`: nothing is wrong here, there is simply nothing yet. The action
wrapper only renders when an action is actually projected — an empty state with no
action ships no dead space for one.

```html
<arena-empty-state icon="ph-bold ph-folder-open"
                   title="No projects yet"
                   message="A project groups deployments, logs and artifacts for one client.">
  <button arena-action mat-flat-button (click)="create()">Create a project</button>
</arena-empty-state>
```

Import `ArenaAction` alongside `EmptyState` in the host component's `imports` —
`arena-action` is a directive, not a plain attribute, because it is how the empty
state detects that an action was projected at all.

**Do / Don't**
- Say what the thing *is* in the message, not just that there are none of it. An empty
  state is often the first time someone reads a definition.
- Give exactly one action. Two competing actions in an empty state is a decision the
  user has no information to make.
- Don't use an empty state for a failed load — that is `arena-error-state`, and the
  difference matters: one invites, the other apologises and offers a retry.
- Don't forget to import `ArenaAction` when projecting an action — without it, the
  `arena-action` attribute is inert and the action silently fails to render.
