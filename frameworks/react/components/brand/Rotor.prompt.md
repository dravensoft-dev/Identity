Brand symbol. Brand, not a UI icon. `spin` only in splash/loading states.

```jsx
<Rotor size="lg" spin />
<Rotor size="sm" color="var(--bone)" />
```

## Do / Don't

- **Don't** pass a number to `size`. The four steps are `--logo-mark-*` tokens, shared
  with `AppLogo` so the two brand components cannot drift apart.
- **Don't** use `Rotor` for a static lock-up. `AppLogo` pairs the mark with the product
  name and holds the manual's variant rules; `Rotor` is the animated mark alone.
