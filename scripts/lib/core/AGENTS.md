# scripts/lib/core/

Modules whose every name comes from `contracts/`. Most open no file at all, so they are placed
by the vocabulary they speak rather than by what they touch.

| module | why it exists |
| --- | --- |
| `serialize-token.mjs` | Renders one DTCG token as a CSS value. Opens no file; every name in it is a DTCG one. |
| `serialize-script.mjs` | Renders one script-readable token as a bare JavaScript number, and derives its identifier from the kebab-case custom property name. |
| `arena-tokens.mjs` | Which tokens a stylesheet reads, which names the generated CSS defines, and the union of those with the hand-authored aliases. Here rather than in any one gate because `check-cdk`, `check-tailwind` and `check-tailwind-coverage` all read them, and a library must not reach up into a gate to do it. |
| `behaviour-compliance.mjs` | Decides whether one element meets one requirement key. **DOM-generic on purpose**: it touches only `tagName`, `getAttribute`, `hasAttribute` and `textContent`, because it is consumed from three runtimes, one of them plain node with no DOM. Returns a third value, `null`, for requirements no single element can decide, so a suite must assert those by acting on the tree. A key in neither table **throws**. |
| `token-preview.mjs` | Maps a token group to how the Overview draws it. Here, and never in the token source, which stays platform-neutral. |
| `validate-palette.mjs` | Contrast and colour-vision-deficiency validation for the chart ramp. **Vendored verbatim** from the `dataviz` Agent Skill, and re-vendored rather than patched, because the thresholds and CVD matrices are calibrated to the Machado-Oliveira-Fernandes (2009) severity-1.0 model, and editing one invalidates published measurements. A second copy ships inside the npm packages, at `generate/core/arena-to-prod/`, and `palette-keys.test.mjs` holds the two byte-equal. |
| `arena-config.mjs` | Arena's own skin expressed as the `arena.config.json` a consumer writes. `check-packages` runs the CLI over it to hold the two palette emitters together, and the assembly writes it into each package as the example to start from, so the config a reader copies is the one the gate proved. |

`behaviour-compliance.mjs` is the clearest case of the placement rule: it is read from both
framework layers' test harnesses and is still `core`, because what it speaks is the contract
vocabulary, not either layer's. **Never place a library by who imports it.**

Every `X.test.mjs` beside a module covers that module.
