# scripts/check/react/

| gate | fails when |
| --- | --- |
| `check-demos-generated.mjs` | a `.jsx` under `frameworks/react/components/` or `ui-kits/console/` has no compiled `.generated.js` sibling, or the sibling differs from a fresh compile, and, in the other direction, when a `.generated.js` is orphaned because the `.jsx` that produced it is gone. Needs `Bun.Transpiler`; exits 2 under plain node. |
| `check-vendor-generated.mjs` | one of the three `frameworks/react/vendor/*.generated.js` bundles differs from a fresh `Bun.build` of the pinned React devDependency, or is missing. Needs `Bun.build`; exits 2 under plain node. |

| `check-react-barrel.mjs` | `frameworks/react/Index.generated.js` or its `.d.ts` differs from a fresh run, a component directory has no `.jsx` or no `.d.ts`, two components export one name so `export *` would shadow one, or a module named in `ROOT_PRIVATE` turns up exported after all. An empty barrel is an explicit failure rather than a clean pass. Pure node. |

The first two subjects are git-ignored, so on a clone with no build those report *missing* and
name the command to run. The barrel is tracked, so it reports *stale* instead. That is the intended signal; see [`../../build/README.md`](../../build/README.md).

Every `X.test.mjs` beside a gate covers that gate.
