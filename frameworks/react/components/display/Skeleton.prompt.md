Loading placeholder for asynchronous data (H1). Use it in tables and dashboards while the response arrives; respect `prefers-reduced-motion`.

```jsx
{loading
  ? <Skeleton variant="text" lines={4} />
  : <Article data={data} />}

<div style={{display:'flex',gap:12}}>
  <Skeleton variant="circle" height="40px" />
  <Skeleton variant="text" lines={2} width="220px" />
</div>
```

**Do / Don't**
- Reproduce the shape of the real content (same approximate height/width) to avoid layout shift on load.
- `width`/`height`/`radius` are CSS strings, not numbers — write `width="40px"`, not `width={40}`.
- `radius` only affects `variant="block"`: a circle is always a perfect circle and text/line rows keep
  a fixed small radius, so passing `radius` to either has no effect.
- Don't leave it up indefinitely: if the load fails, replace it with `ErrorState`, not an eternal skeleton.
