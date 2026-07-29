The panel every signed-out screen needs. It is a frame, not a form: no `email`, no
`password`, no `onSubmit`, no validation. Fields are composed from `Input` and
`Button`, which is what lets the same component serve "Welcome back", "Check your
inbox", "This link expired" and "Enter your two-factor code".

`eyebrow` and `title` are plain strings — Arena draws both entirely (the mono crimson
microlabel, the display-weight heading), so there is no markup for a consumer to
supply. `brand`, `footer` and the children default slot stay nodes.

```jsx
<UnauthCard
  brand={<AppLogo size="md" mark={<img src="/assets/rotor-crimson.svg" alt="" />} name="Draven" dim="soft" />}
  eyebrow="Delivery console"
  title="Welcome back"
  footer={<a href="/reset">Forgot your password?</a>}>
  <Input label="Email" value={email} onChange={onEmail} />
  <Input label="Password" type="password" />
  <Button variant="primary" full>Sign in</Button>
</UnauthCard>
```

**It does not centre itself** — the product owns the page. The wrapper is three lines,
and writing them is what keeps a split layout beside an illustration possible:

```jsx
<div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(var(--sp-1) * 6)' }}>
  <UnauthCard …>…</UnauthCard>
</div>
```

## Do / Don't

- **Do** stack the fields yourself, in a flex column with a `--sp` gap. The panel does
  not decide how many fields there are or how they space.
- **Do** put a "sign in with Google" button, an "or" divider or a resend timer straight
  into `children`. It is a card, so it is composed into — none of those needs a prop.
- **Don't** give it credentials or a submit handler. The moment it knows about a
  password it stops being the panel the other screens use.
- **Don't** centre it from inside, and don't wrap it in something that assumes it owns
  the viewport.
- **Don't** reach for a bare `Card` for a signed-out screen. This one carries the brand
  slot, the constrained width, the panel padding and the centred footer — the four
  things that would otherwise be rewritten per screen.
- **Don't** pass JSX into `eyebrow` or `title` — both are strings the component draws
  itself, not slots.
- **Don't** pass `style` or other DOM attributes to `UnauthCard` — it accepts no escape
  hatch. Wrap it in your own `<div>` for outer layout, the way the three-line centring
  wrapper above already does.
