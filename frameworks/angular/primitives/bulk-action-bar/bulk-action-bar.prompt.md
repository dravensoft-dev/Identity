Arena bulk actions bar. It renders only when `count` is above zero, states the size of
the selection in mono, and offers actions that operate on the set. A destructive
action stays outline in `--error` -- transparent at rest, the soft `--danger-soft`
tint only on hover -- like every risk trigger but one; the filled danger surface stays
`arena-confirm-dialog`'s alone. Import `ArenaBulkAction` for the `actions` input's
element type. Styling is the sibling `bulk-action-bar.variants.ts` recipe.

```html
<arena-bulk-action-bar [count]="selected().length" noun="deployments"
                       [actions]="[
                         { label: 'Re-run', icon: 'ph-bold ph-arrow-clockwise' },
                         { label: 'Archive', icon: 'ph-bold ph-archive' },
                         { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true }
                       ]"
                       (run)="apply($event)" (cleared)="selected.set([])" />
```

**Do / Don't**
- Always offer Clear. A selection the user cannot see the edges of is a selection they
  will act on by accident.
- Put the destructive action last, and confirm it with `arena-confirm-dialog` -- the bar
  starts the action, it does not finish it.
- Don't hide the bar behind a menu. Its whole job is to be visible the moment a
  selection exists.
