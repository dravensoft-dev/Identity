# scripts/check/react/

| gate | fails when |
| --- | --- |
| `check-demos-generated.mjs` | a `.jsx` under `frameworks/react/components/` or `ui-kits/console/` has no compiled `.generated.js` sibling, or the sibling differs from a fresh compile — and, in the other direction, when a `.generated.js` is orphaned because the `.jsx` that produced it is gone. Needs `Bun.Transpiler`; exits 2 under plain node. |
| `check-vendor-generated.mjs` | one of the three `frameworks/react/vendor/*.generated.js` bundles differs from a fresh `Bun.build` of the pinned React devDependency, or is missing. Needs `Bun.build`; exits 2 under plain node. |

Both subjects are git-ignored, so on a clone with no build these report *missing* and name the
command to run. That is the intended signal — see [`../../build/README.md`](../../build/README.md).

Every `X.test.mjs` beside a gate covers that gate.
