# scripts/check/react/

| gate | fails when |
| --- | --- |
| `check-demos-generated.mjs` | a `.tsx` under `frameworks/react/components/` or `ui-kits/console/` has no compiled `.generated.js` sibling, or the sibling differs from a fresh compile, and, in the other direction, when a `.generated.js` is orphaned because the source that produced it is gone. Needs `Bun.Transpiler`; exits 2 under plain node. |
| `check-vendor-generated.mjs` | one of the three `frameworks/react/vendor/*.generated.js` bundles differs from a fresh `Bun.build` of the pinned React devDependency, or is missing. Needs `Bun.build`; exits 2 under plain node. |

| `check-react-barrel.mjs` | `frameworks/react/Index.generated.js` or its `.d.ts` differs from a fresh run, a component directory holds no source at all, two components export one name so `export *` would shadow one, or a module named in `ROOT_PRIVATE` turns up exported after all. An empty barrel is an explicit failure rather than a clean pass. Pure node. |
| `check-react-types.mjs` | `frameworks/react/tsconfig.check.json` does not typecheck. It is the only gate that can catch a component disagreeing with the interface declared beside it, which is what a hand-written declaration never could. `tsc` runs under plain node, so unlike the two above this gate has no skip path. |

The first two subjects are git-ignored, so on a clone with no build those report *missing* and
name the command to run. The barrel is tracked, so it reports *stale* instead. That is the intended signal; see [`../../build/README.md`](../../build/README.md).

Every `X.test.mjs` beside a gate covers that gate.
