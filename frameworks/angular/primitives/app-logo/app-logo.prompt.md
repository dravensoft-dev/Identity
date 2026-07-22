Arena brand lock-up. Project the mark as the component's content and pass the product
name; one `size` picks both the mark's box and the wordmark, from the `--logo-*` scale.
Styling is the sibling `app-logo.variants.ts` recipe; the component carries no CSS
classes of its own.

```html
<arena-app-logo name="Draven" dim="soft" size="md">
  <img src="/assets/your-mark.svg" alt="" />
</arena-app-logo>

<arena-app-logo name="Delivery" size="lg" orientation="vertical">
  <img src="/assets/your-client-mark.svg" alt="" />
</arena-app-logo>
```

**Do / Don't**
- Give the projected mark no width or height of its own. The slot sizes it; a mark that
  brings its own dimensions breaks the ratio the lock-up exists to hold.
- Use `dim` for the second ink of a two-part wordmark, and pass no space between the
  parts — `name="Draven" dim="soft"` renders DRAVENSOFT in two inks, one word.
- Don't ship it with a mark that is not yours. Nothing defaults here on purpose: Arena is
  MIT and a default mark would be someone else's trademark travelling in your build.
- Don't reach for a fifth size. Four steps are the repertoire; a size between them is a
  token question, not a call-site one.
