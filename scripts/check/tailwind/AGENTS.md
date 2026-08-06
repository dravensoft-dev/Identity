# scripts/check/tailwind/

| gate | fails when |
| --- | --- |
| `check-tailwind.ts` | a class some manifest names emits no rule, a `@theme` key resolves to no real token, **or the gate found no manifests at all**, because one iterating zero manifests finds zero violations by construction. |
| `check-tailwind-generated.ts` | `Utilities.generated.css` or a `*.manifest.generated.ts` differs from a fresh compile of the preset and the `.manifest.json` sources. |
| `check-tailwind-coverage.ts` | a token reaches no utility and is not named in `EXCLUDED` with a reason, or an `EXCLUDED` entry names a token that no longer exists. |
| `check-arbitrary-values.ts` | a Tailwind bracket carries a raw literal instead of `var(--token)`, a `calc()`/`min()`/`max()`/`clamp()` over one, zero, or a unit the token layer does not model. |
| `check-radius-tokens.ts` | a manifest writes `rounded-full` where `rounded-pill` belongs. Deliberately that one class: it is the only utility in a cleared `--radius-*` namespace that still resolves without an Arena token behind it. |
| `check-component-css.ts` | a class a manifest names has no rule, a rule no manifest derives has one, an emitted sheet still reads a Tailwind theme property (so the strip did not run and an adopter's own `--spacing` reaches in), a property resolves to no Arena token, or the prelude has lost the `@property` registrations without which every border and the focus ring are invalid at computed-value time. |
| `check-style-parity.ts` | an element carrying the Arena class names does not compute the same style as one carrying the recipe's own class string, in a real browser, for any slot of any variant, at rest or under reduced motion. `Utilities.generated.css` is the oracle, which is why it survives as a build-time artifact once it stops being published. |

`check-style-parity` is the one that would catch the change nothing else can see, and it is
also the reason the recipe stays buildable: it compares what `arenaTv()` produces against what the
emitted CSS paints, so it is a claim about **rendering** where every other gate here is a
claim about text. It needs a browser and reports `SKIP` without one.

The last is the converse of `check-tailwind-coverage` and just as narrow: it does not attempt
"every utility traces to a token" in general, only this one verified case.

**No gate here compares a manifest against the component it mirrors.** The mapping is not
one-to-one, because a manifest mirrors a React component and an `arena-*` primitive at once and a
compound family's one manifest mirrors several of each, so that check is by hand. The one
narrow slice that is machine-checked lives elsewhere, as `check:states` in `../arena/`.

Every `X.test.mjs` beside a gate covers that gate. Three suites here name no gate:
`manifest-classes.test.ts` covers `frameworks/tailwind/ManifestClasses.js`,
`arenaTv-merge.test.mjs` covers the shared `Tv.ts`, and `theme-namespaces.test.ts` covers
`Theme.css` itself, asserting that every namespaced property in it is attributed to a
namespace or listed with a reason. All three are claims about the layer this domain gates
rather than about any one gate, and the third is deliberately independent of the other two:
it holds the preset whether or not anything still merges a class string.
