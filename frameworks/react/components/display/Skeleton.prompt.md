Loading placeholder for asynchronous data (H1). Use it in tables and dashboards while the response arrives; respect `prefers-reduced-motion`.

```jsx
{loading
  ? <Skeleton variant="text" lines={4} />
  : <Article data={data} />}

<div style={{display:'flex',gap:12}}>
  <Skeleton variant="circle" height={40} />
  <Skeleton variant="text" lines={2} width={220} />
</div>
```

**Do / Don't**
- Reproduce the shape of the real content (same approximate height/width) to avoid layout shift on load.
- Don't leave it up indefinitely: if the load fails, replace it with `ErrorState`, not an eternal skeleton.
