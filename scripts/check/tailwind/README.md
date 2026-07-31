# scripts/check/tailwind/

| gate | fails when |
| --- | --- |
| `check-tailwind.mjs` | a class some manifest names emits no rule, a `@theme` key resolves to no real token — **or the gate found no manifests at all**, because one iterating zero manifests finds zero violations by construction. |
| `check-tailwind-generated.mjs` | `Utilities.generated.css` or a `*.manifest.generated.ts` differs from a fresh compile of the preset and the `.manifest.json` sources. |
| `check-tailwind-coverage.mjs` | a token reaches no utility and is not named in `EXCLUDED` with a reason — or an `EXCLUDED` entry names a token that no longer exists. |
| `check-arbitrary-values.mjs` | a Tailwind bracket carries a raw literal instead of `var(--token)`, a `calc()`/`min()`/`max()`/`clamp()` over one, zero, or a unit the token layer does not model. |
| `check-radius-tokens.mjs` | a manifest writes `rounded-full` where `rounded-pill` belongs. Deliberately that one class: it is the only utility in a cleared `--radius-*` namespace that still resolves without an Arena token behind it. |

The last is the converse of `check-tailwind-coverage` and just as narrow — it does not attempt
"every utility traces to a token" in general, only this one verified case.

**No gate here compares a manifest against the component it mirrors.** The mapping is not
one-to-one — a manifest mirrors a React component and an `arena-*` primitive at once, and a
compound family's one manifest mirrors several of each — so that check is by hand. The one
narrow slice that is machine-checked lives elsewhere, as `check:states` in `../arena/`.

Every `X.test.mjs` beside a gate covers that gate. Two suites here name no gate:
`manifest-classes.test.mjs` covers `frameworks/tailwind/ManifestClasses.js`, and
`tv-merge.test.mjs` covers the shared `Tv.ts` — both are claims about the layer this domain
gates rather than about any one gate.
