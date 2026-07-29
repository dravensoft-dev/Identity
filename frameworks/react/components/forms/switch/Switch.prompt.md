Controlled on/off switch showing an icon per state (`iconOn`/`iconOff`, Phosphor class
strings — Arena draws the `<i>`). `state` is the CURRENT value; the host owns it and
pushes it back on every render.

```jsx
const [dark, setDark] = useState(false);

<Switch state={dark} onFuncOn={() => setDark(true)} onFuncOff={() => setDark(false)}
  iconOn="ph-bold ph-moon" iconOff="ph-bold ph-sun" label="Dark theme" />
```

`onFuncOn`/`onFuncOff` are transition events, not a value — each fires with no payload,
once, for the direction the activation moved. There is no `onChange`: read the direction
from which handler fired, not from an event argument.

For **high-impact** toggles (H5) add `confirm`: an activate no longer fires
`onFuncOn`/`onFuncOff` at all — it calls `onRequestChange()` instead (also payload-less;
the requested value is always `!state`), so the host can open a ConfirmDialog and push
`state` itself once the user confirms.

```jsx
const [armed, setArmed] = useState(false);
const [pending, setPending] = useState(false);

<Switch label="Automatic deployment to production" state={armed} confirm
  onRequestChange={() => setPending(true)} />

<ConfirmDialog open={pending} title="Enable automatic deployment"
  confirmLabel="Enable" onCancel={() => setPending(false)}
  onConfirm={() => { setArmed(!armed); setPending(false); }}>
  Every approved commit will be deployed to production without manual review.
</ConfirmDialog>
```

`orientation` (`'horizontal'` default | `'vertical'`) lays the track along the other axis —
reach for `vertical` only where the surrounding layout is itself vertical (a narrow
settings rail), never as a decorative variant. `size` (`'sm' | 'md' | 'lg' | 'xl' | '2xl'`,
default `'md'`) scales the track and knob together; `'md'` matches the pre-redesign
component's only size exactly, so an existing call site that names no `size` renders
unchanged.

**Do** own `state` in the parent and push it back from `onFuncOn`/`onFuncOff` (or from
`ConfirmDialog`'s `onConfirm` when `confirm` is set) — Switch never changes its own value.

```jsx
<Switch state={notify} onFuncOn={() => setNotify(true)} onFuncOff={() => setNotify(false)} label="Notify on approval" />
```

**Don't** treat `onFuncOn`/`onFuncOff` as a replacement `onChange(next)` — there is no
payload, and reaching for `e.target.checked` or a boolean argument is reaching for a
member this API does not have.

```jsx
{/* Wrong: there is no event object and no boolean argument to read. */}
<Switch state={notify} onFuncOn={(e) => setNotify(e.target.checked)} label="Notify on approval" />
```

**Don't** wire both `confirm` and `onFuncOn`/`onFuncOff` expecting the transition events
to still fire once confirmed — they never do. While `confirm` is set, activation always
routes through `onRequestChange()` alone; flip `state` from wherever the confirmation
resolves (typically `ConfirmDialog`'s `onConfirm`), not from a transition event that
`confirm` suppresses.
