Arena switch — an on/off setting that takes effect immediately, not a pending form value.
Standalone, `OnPush`, signal I/O. Styling is the sibling `Switch.variants.ts` recipe. The host
binds the root slot, so `<arena-switch>` is itself the flex row its parent lays out. The control
is a real `<button type="button" role="switch">`: the platform supplies activation, the role
supplies the state.

```html
<arena-switch label="Auto-deploy on merge" [state]="auto()"
              (funcOn)="auto.set(true)" (funcOff)="auto.set(false)" />

<arena-switch label="Dark theme" [state]="dark()" iconOn="ph-bold ph-moon" iconOff="ph-bold ph-sun"
              (funcOn)="dark.set(true)" (funcOff)="dark.set(false)" />

<arena-switch label="Allow force pushes" confirm [state]="force()"
              (requestChange)="askThenApply()" />

<arena-switch label="Managed by policy" state disabled />
<arena-switch label="Compact rows" size="sm" orientation="vertical" [state]="compact()" />
```

**Do / Don't**
- It is **controlled**. `state` is what the consumer owns; the component holds no copy, so a
  `funcOn` you ignore is a switch that visibly does not move.
- **`label` is required** and is the accessible name — the `aria-label` on the control and the
  text beside it. There is no unlabelled shape, which is why the input has no default.
- The events are three, and they are directional rather than a single toggle: `funcOn` and
  `funcOff` say which way it went, so a handler needs no copy of the old value to read.
- `confirm` **replaces** the two: nothing is applied, `requestChange` fires instead, and the host
  opens a `ConfirmDialog` and sets `state` itself on confirmation. The requested value is always
  the negation of the current one, so the event carries no payload.
- **Angular always requests under `confirm`; React falls back.** React's `Switch` diverts only
  when an `onRequestChange` handler was actually passed, and otherwise applies the change as if
  `confirm` were unset. Angular cannot see whether an output was subscribed, and does not try:
  `confirm` set with no `(requestChange)` binding is a switch that does nothing. That is the
  contract read literally, and it fails loudly rather than silently applying a guarded change.
- `iconOn` and `iconOff` are Phosphor class-name strings drawn inside the knob, and only the
  current state's glyph is in the DOM. They are decoration — the knob is `aria-hidden`, and
  `aria-checked` is what carries the state.
- Use a switch for an immediate effect and `<arena-checkbox>` for a pending form value. A switch
  inside a form that only applies on submit is the wrong control.
- `orientation="vertical"` transposes the track. It exists for a dense sidebar; in a form row it
  reads as a mistake.
- Don't disable a switch to mean "you may not change this yet". A disabled switch is unreachable
  by Tab and announces no reason; `confirm` is the affordance for a change that needs a gate.

**By hand, in real Chromium** — none of these is provable in happy-dom. Run `bun run demos` and
open `/frameworks/angular/components/forms/switch/Switch.card.html`:
- The knob **slides** across the track over `--dur-mid` rather than jumping, and the track's
  colour crossfades with it.
- Under `prefers-reduced-motion: reduce`, forced in DevTools' Rendering pane, **the knob stops
  travelling and the track colour still crossfades**. That is the intended answer for a state
  change: the travel is decorative and the colour is the report. `motion-reduce:transition-none`
  on the `knob` slot is what does it, and React's `Switch` answers the same way through its own
  injected `@media` block.
- At every size the knob clears the track's padding on both ends, and the vertical transpose
  travels down rather than across.
- The glyph is legible inside the knob at `sm`, which is the size that decides whether per-state
  icons are usable at all.
- Clicking the label toggles; clicking the label of a disabled switch does not.
