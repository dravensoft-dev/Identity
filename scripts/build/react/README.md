# scripts/build/react/

| script | emits | why it exists |
| --- | --- | --- |
| `build-demos.mjs` | `frameworks/react/**/*.generated.js`, one per `.jsx` | JSX is compiled ahead of time, not in the browser, so a demo page loads a real ES module with no transform step. It also rewrites each relative `./X.jsx` import to `./X.generated.js`, which is what makes the compiled tree self-consistent. |
| `build-vendor.mjs` | `frameworks/react/vendor/*.generated.js` | React 18 ships CommonJS only, and an importmap needs real ES modules. Bundles the three entry points, appends the named exports Bun's static detection misses, and keeps `react` external so it stays a singleton across the three files. |
| `build-react-barrel.mjs` | `frameworks/react/Index.generated.js` and `.d.ts` | The layer's entry point: one `export *` per component directory, plus the four layer-root helpers. Derived from the tree rather than hand-listed, because a hand-listed barrel is how the Angular layer shipped five primitives nobody could import. `Tokens.generated` is deliberately absent, for the reason its Angular counterpart is. |

Those first two outputs are git-ignored: only demo pages read them, and the `.jsx` is the
source a consumer copies. `check:demos` and `check:vendor` compare them against a fresh
compile. **The barrel is the exception and is tracked**, because a package consumer imports
it and the copy-in kit indexes it, which is the same audience test `contracts/design-generated/`
passes; `check:react-barrel` holds it to a fresh run.

**Editing a component `.jsx` means running `bun run build:demos` in the same tree.** The React
DOM suites import the `.jsx` directly, so every test stays green with the `.generated.js`
sibling stale, and the demo pages load the sibling, so `bun run demos` would show the
pre-fix component while the suites prove the fix.

Every `X.test.mjs` beside a script covers that script.
