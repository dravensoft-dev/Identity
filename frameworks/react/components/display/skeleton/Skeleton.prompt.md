Loading placeholder for asynchronous data (H1). Use it in tables and dashboards while the response arrives; respect `prefers-reduced-motion`.

```jsx
{loading
  ? <Skeleton variant="text" lines={4} />
  : <Article data={data} />}

<div role="status" aria-label="Loading profile">
  <div style={{display:'flex',gap:'var(--sp-3)'}} aria-hidden="true">
    <Skeleton variant="circle" height="40px" />
    <Skeleton variant="text" lines={2} width="220px" />
  </div>
</div>
```

**Do / Don't**
- Reproduce the shape of the real content (same approximate height/width) to avoid layout shift on load.
- `width`/`height`/`radius` are CSS strings, not numbers; write `width="40px"`, not `width={40}`.
- `radius` only affects `variant="block"`: a circle is always a perfect circle and text/line rows keep
  a fixed small radius, so passing `radius` to either has no effect.
- A `variant="text"` stack is one `<Skeleton>` and one announcement no matter how many `lines` it
  renders: the first example above (`lines={4}`) is a single `role="status"`, not four. The
  repetition below is between sibling `<Skeleton>` elements, never within one stack.
- Don't wrap a *single* `<Skeleton>` in a live region of your own, because it already carries
  `role="status"`, so a wrapper adds a second announcement of the same wait. The wrapper in
  the example above is for a **set** of siblings, which is the different case below.
- Every `<Skeleton>` announces itself (`role="status"`, `aria-label="Loading"`), so several
  siblings, a circle beside a text stack, several independent skeletons in a list, are that
  many announcements, because the component cannot know where one set of placeholders begins
  and ends. A set standing for one block of content should be announced once, by you: wrap it in
  a single `role="status" aria-label="…"` naming *what* is loading, and mark the container holding
  the individual skeletons `aria-hidden="true"` so their own announcements never reach the
  accessibility tree.
- Don't leave it up indefinitely: if the load fails, replace it with `ErrorState`, not an eternal skeleton.
