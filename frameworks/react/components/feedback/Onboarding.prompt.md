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

**Behaviour.** The coachmark is a modal dialog and behaves like one: opening moves focus to
the first control inside it, Tab is trapped at both ends of that set, closing restores focus
to whatever had it before, and **Escape dismisses through `onSkip`** — the same channel the
scrim click uses, so Escape joins the mouse path rather than replacing it. There is no
separate "dismiss" callback to wire.

**The accessible name is a fallback chain**, `step.title ?? step.eyebrow ?? "Step N of M"`,
matching what the Angular layer computes. **A caller who wants a useful name still supplies a
step `title`** — a positional name is a floor, not a substitute. On a step with neither
`title` nor `eyebrow` the dialog is announced as `Step 2 of 3`, which is the exact string the
progress dots inside it already carry as their own `aria-label`, so a screen reader announces
the two identically. That is the cost of keeping `OnboardingStep.title` optional and is
mirrored from Angular deliberately, not an oversight.

**Checked in Chromium by hand**, because native sequential focus navigation is the browser's
and no suite in this repo drives one: with the tour open, Tab repeatedly through Back / Skip /
Next and confirm focus never leaves the coachmark, then Shift+Tab back through it. The
boundary wraps at either end are covered by `frameworks/react/test-dom/onboarding-modal.test.jsx`;
the interior is this check.

**Do / Don't**
- Max 3–5 steps, and store that it was already completed so it isn't repeated.
- Don't block critical tasks after the tour: "Skip" must always be available.
- Give every step a `title` (or at least an `eyebrow`): without one the dialog names itself
  positionally and tells a screen-reader user nothing about what it is showing them.
