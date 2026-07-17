Modal for confirmations and short forms. Overlay with blur.

```jsx
<Dialog open={o} onClose={close} eyebrow="Confirm" title="Deploy to production"
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={go}>Deploy</Button></>}>
  This action publishes build #4821 for all users.
</Dialog>
```