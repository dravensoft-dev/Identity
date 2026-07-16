Breadcrumb navigation (H3). Gives an explicit return path when the hierarchy is deeper than the tabs. The last item is the current page (not linked).

```jsx
<Breadcrumbs items={[
  { label: 'Projects', onClick: goProjects },
  { label: 'Checkout', onClick: goProject },
  { label: 'Deployment #482' },
]} />
```

**Do / Don't**
- The last item is the current location: no link, styled in `--bone`.
- Don't replace tabs with breadcrumbs or vice versa; they coexist (tabs = sibling sections, breadcrumbs = depth).
