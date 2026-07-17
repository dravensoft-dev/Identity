Indeterminate wait indicator, for the waits with no known percentage. Respects `prefers-reduced-motion` by slowing down, not stopping — a frozen spinner reads as a hung process.

```jsx
<Spinner label="Loading projects" />
<Spinner size="sm" tone="on-accent" />        {/* inside a filled button */}
<Spinner size="lg" tone="neutral" label="Connecting to the build server" />
```

**Do**
- Reach for `ProgressBar` first. A spinner is the fallback for when no real percentage exists; a determinate bar communicates remaining time and a spinner cannot.
- Give `label` the real subject ("Loading projects") — it is the accessible name, and "Loading" alone tells a screen-reader user nothing.
- Use `tone="on-accent"` on a filled crimson surface so the ring stays legible.

**Don't**
- Don't use a spinner for a process whose progress you know: that degrades visibility (H1).
- Don't expect `success`/`warning`/`danger` tones — they don't exist here, on purpose. A wait has no state to report, and a spinner tinted `--danger` would announce a failure that hasn't happened. Report the outcome with a `Toast` or an `Alert`.
- Don't stack a spinner on top of a `Skeleton`. Pick one: the skeleton reserves the layout, the spinner marks an unsized wait.

**On the tone vocabulary.** `ProgressBar` ships `accent | gold | success | danger | info`; `Spinner` ships `accent | gold | neutral | on-accent`. The overlap (`accent`, `gold`) resolves to the same tokens, so the two read as one family. The divergence is deliberate, in both directions — see Don't, above.
