Arena guided tour. A coachmark with progress dots, Skip and Next, floating bottom-right
over an unblurred scrim — a tour that blurs the product it is touring defeats itself.
It is controlled: the host owns `index` and answers `next`, `back`, `skip` and `done`.
Clicking the scrim reports `skip`, the same as clicking it in React. It is a real modal:
focus moves into the panel when the tour opens and returns to whatever opened it when the
tour closes, Tab and Shift+Tab cycle inside the panel, and Escape reports `skip`.

```html
<arena-onboarding [open]="touring()" [steps]="steps" [index]="step()"
                  [anchor]="target()?.getBoundingClientRect()"
                  (next)="step.set(step() + 1)" (back)="step.set(step() - 1)"
                  (skip)="touring.set(false)" (done)="finish()" />
```

**Do / Don't**
- Keep a tour to three or four steps. The dots are a promise about how long this will
  take, and a tour that breaks that promise gets skipped.
- Pass `anchor` (an `OnboardingAnchor` — `{ left, bottom }`; a `getBoundingClientRect()`
  result satisfies it directly) when a step must point at a specific control; the
  coachmark clamps itself inside the viewport. Without it, it floats bottom-right.
- Handle `skip` as a real dismissal: Escape reports it too, on every step including the
  last one, where the Skip button itself is not rendered. Escape is how a user leaves,
  not how they finish, so it never reports `done`.
- Don't put anything in a tour that the interface should have made obvious. A
  coachmark explaining a confusing control is a bug report with a nicer border.
