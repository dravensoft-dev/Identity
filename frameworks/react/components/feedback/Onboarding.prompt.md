Guided in-product onboarding (H10). Complements `EmptyState`: presents features step by step the first time. Controlled — store `index` and whether it was already completed (e.g. in localStorage) so it isn't repeated.

```jsx
const [step, setStep] = useState(0);
<Onboarding open={showTour} index={step}
  onNext={() => setStep((s) => s + 1)}
  onBack={() => setStep((s) => s - 1)}
  onSkip={endTour} onDone={endTour}
  steps={[
    { eyebrow: 'Welcome', title: 'Your first deployment', body: 'From here you'll deploy and roll back with one click.' },
    { title: 'Command palette', body: 'Press ⌘K to run any action without the mouse.' },
    { title: 'All set', body: 'You can reopen this guide from Help anytime.' },
  ]} />
```

**Do / Don't**
- Max 3–5 steps, and store that it was already completed so it isn't repeated.
- Don't block critical tasks after the tour: "Skip" must always be available.
