# scripts/check/arena/

The domain for a gate that reads two or more layers at once, or the repository root.

| gate | fails when |
| --- | --- |
| `check-all.mjs` | — not a gate. The runner: `GATES` is the registry, and `testStep()` is the **single authority** for how the test suite is invoked. Read the invocation there rather than reconstructing one; a narrowed run matching fewer files is indistinguishable from one matching all of them. |
| `check-docs.mjs` | a `.md` exceeds 60,000 characters, or a hand-written source carries a comment it is not allowed — `scripts/` and tests may carry one header of at most 10 lines, everything else none. It finds comments by lexing, so a `//` inside a string is never mistaken for one, and a `.generated.` file is skipped unread. |
| `check-generated.mjs` | a file whose header says a script writes it does not say so in its name, or a `.generated.` file is neither tracked nor covered by a reason-carrying ignore entry. Both directions fail silently otherwise: an unnamed output is read as hand-written, and an ignored payload file ships a tag whose `intro/styles.css` `@import`s resolve to nothing. |
| `check-api.mjs` | a layer's implementation diverges from `contracts/api/components/<Name>.json`. **No exception map at all**, deliberately: a contract forbids divergence, so it has nowhere for a second opinion to live. |
| `check-behaviour.mjs` | a component declares no `<Name>.behaviour.json`, names a pattern or requirement that does not exist, or the two layers disagree without saying why. A green run is a **coverage** claim, never an accessibility one. |
| `check-compliance.mjs` | a coverage claim in `COVERED` is stale — a suite that no longer exists, or one whose layer key does not match the `SUITE_DIRS` tree it was found under. Coverage is partial by design; the gate never demands totality, only that every claim is true. |
| `check-structure.mjs` | a component is declared in two categories, sits in a category `frameworks/Components.json` assigns elsewhere, is named by no declaration, or is present in no layer. It says nothing about whether the category is the **right** one. |
| `check-script-tokens.mjs` | a `Tokens.generated.*` module disagrees with the DTCG source or the CSS, a `script: true` flag is orphaned, or `CatSlot` stops being exactly `1..catSlots` in order. |
| `check-duplicate-constants.mjs` | the same module-level named numeric constant is declared in **both** framework layers. |
| `check-dimension-literals.mjs` | a framework layer writes a bare literal in a property the token layer governs. `EXEMPT` and `PASSTHROUGH` are asserted by name in the paired suite, so changing either is a change to both. |
| `check-manifest-states.mjs` | a manifest slot carries a `hover:`/`focus:` state modifier no contract it covers declares in `affordances`, or a React component implements a state its contract does not declare. Both halves read the contract and neither reads the other layer; both run one way only, because a declared affordance a layer leaves to the child it composes is not a divergence. `MANIFEST_COVERS` carries the wider surfaces with a reason each. This checks **states only** — nothing about colors, sizes or slot structure. |
| `check-layer-independence.mjs` | a file under `frameworks/<A>` names layer B or one of B's source files, by import or in prose. `ALLOWED` carries the one edge — Angular consuming a Tailwind manifest — and `EXEMPT` the individual cases, both asserted by name in the paired suite. A citation is caught in prose as well as in an import because the coupling this gate replaced was almost entirely prose. |
| `check-focus-trap.mjs` | a modal panel's interior lets Tab escape, in any layer that binds `dialog-modal`. Drives real Chromium over each declared page and presses a real Tab, which is the one thing a happy-dom suite cannot prove; exits 2 without a browser. |
| `check-card-viewports.mjs` | a page's rendered content over-runs the `@dsCard` viewport it declares, in either axis, because the card is cropped to it and the overflow is lost silently. Needs a headless browser; exits 2 without one. |
| `check-release.mjs` | any release surface disagrees with `.claude-plugin/plugin.json`, above all when the `plugin.json` **at the pinned tag** hands out a different version than the marketplace advertises. Forgetting the `ref` fails silently: the update is never offered and nothing errors. Run by path — no npm script. |

Every `X.test.mjs` beside a gate covers that gate. Two suites here name no gate:
`browser-modules.test.mjs` covers the `intro/` runtime modules, and
`components-categories.test.mjs` covers `frameworks/Components.json` — both are claims about
the repository root, which is what makes them `arena`.
