# scripts/check/arena/

The domain for a gate that reads two or more layers at once, or the repository root.

| gate | fails when |
| --- | --- |
| `check-all.mjs` | not a gate, but the runner: `GATES` is the registry, and `testStep()` is the **single authority** for how the test suite is invoked. Read the invocation there rather than reconstructing one; a narrowed run matching fewer files is indistinguishable from one matching all of them. |
| `check-docs.mjs` | a `.md` exceeds 60,000 characters, a `.md` punctuates its prose with an em dash, or a hand-written source carries a comment it is not allowed: `scripts/` and tests may carry one header of at most 10 lines, everything else none. `SIZE_EXEMPT` names the three documents exempt from the limit by charter and `PROSE_EXEMPT` the one tree exempt from the punctuation rule, each with its reason. Both rules read by lexing, so a `//` inside a string is never mistaken for a comment and an em dash inside a fence or a code span is the document quoting code; a `.generated.` file is skipped unread. |
| `check-generated.mjs` | a file whose header says a script writes it does not say so in its name, or a `.generated.` file is neither tracked nor covered by a reason-carrying ignore entry. Both directions fail silently otherwise: an unnamed output is read as hand-written, and an ignored payload file ships a tag whose `intro/styles.css` `@import`s resolve to nothing. |
| `check-catalog.mjs` | `frameworks/Catalog.generated.md` stops matching a fresh emit. The catalog is tracked rather than built, because the plugin is served from the git tag where nothing runs a build, so a stale copy is a wrong answer handed to every reader of that tag with every other gate green. Fails on an empty declaration too, rather than comparing a catalog of nothing against a catalog of nothing. |
| `check-api.mjs` | a layer's implementation diverges from `contracts/api/components/<Name>.json`. **No exception map at all**, deliberately: a contract forbids divergence, so it has nowhere for a second opinion to live. |
| `check-behaviour.mjs` | a component declares no `<Name>.behaviour.json`, names a pattern or requirement that does not exist, or the two layers disagree without saying why. A green run is a **coverage** claim, never an accessibility one. |
| `check-compliance.mjs` | a coverage claim in `COVERED` is stale: a suite that no longer exists, or one whose layer key does not match the `SUITE_DIRS` tree it was found under. Coverage is partial by design; the gate never demands totality, only that every claim is true. |
| `check-contracts.mjs` | `contracts/` stops holding the shape `contracts/README.md` describes: a stray file in a level, a level missing its normative document, an undeclared inner directory, or a fourth directory beside the three. `SHAPE` is the declaration, and `design` is the one level whose normative statement is two documents, `README.md` for what a value means and `TokenTypes.md` for the shape it arrives in. It is `check-structure.mjs`'s analogue for `contracts/`. |
| `check-structure.mjs` | a component is declared in two categories, sits in a category `frameworks/Components.json` assigns elsewhere, is named by no declaration, or is present in no layer. It says nothing about whether the category is the **right** one. |
| `check-script-tokens.mjs` | a `Tokens.generated.*` module disagrees with the DTCG source or the CSS, a `script: true` flag is orphaned, or `CatSlot` stops being exactly `1..catSlots` in order. |
| `check-duplicate-constants.mjs` | the same module-level named numeric constant is declared in **both** framework layers. |
| `check-dimension-literals.mjs` | a framework layer writes a bare literal in a property the token layer governs. `EXEMPT` and `PASSTHROUGH` are asserted by name in the paired suite, so changing either is a change to both. |
| `check-manifest-states.mjs` | a manifest slot carries a `hover:`/`focus:` state modifier no contract it covers declares in `affordances`, or a React component implements a state its contract does not declare. Both halves read the contract and neither reads the other layer; both run one way only, because a declared affordance a layer leaves to the child it composes is not a divergence. `MANIFEST_COVERS` carries the wider surfaces with a reason each. This checks **states only**, and nothing about colors, sizes or slot structure. |
| `check-layer-independence.mjs` | a file under `frameworks/<A>` names layer B or one of B's source files, by import or in prose. `ALLOWED` carries the one edge, Angular consuming a Tailwind manifest, and `EXEMPT` the individual cases, both asserted by name in the paired suite. A citation is caught in prose as well as in an import, because prose is where such a coupling mostly lives. |
| `check-focus-trap.mjs` | a modal panel's interior lets Tab escape, in any layer that binds `dialog-modal`. Drives real Chromium over each declared page and presses a real Tab, which is the one thing a happy-dom suite cannot prove; without a browser it cannot run, which the declared strict setting makes a failure rather than a skip. |
| `check-card-viewports.mjs` | a page's rendered content over-runs the `@dsCard` viewport it declares, in either axis, because the card is cropped to it and the overflow is lost silently. Needs a headless browser, on the same terms. |
| `check-packages.mjs` | the `arena-theme` CLI that ships inside both npm packages stops emitting what Style Dictionary emits, or an assembled `dist/` is not registry-standard: a version out of step with `plugin.json`, an `exports` target that was never emitted, an install script, a missing README, or Phosphor bundled rather than declared a peer. Two emitters exist for the palette, so something has to hold them together; a zero-declaration comparison is an explicit failure. `dist/` is git-ignored, so the manifest half is skipped on a fresh clone and the run says so. |
| `check-release.mjs` | any release surface disagrees with `.claude-plugin/plugin.json`, above all when the `plugin.json` **at the pinned tag** hands out a different version than the marketplace advertises. Forgetting the `ref` fails silently: the update is never offered and nothing errors. Run by path, with no npm script. |

## What `check-dimension-literals.mjs` reaches

The scan reaches four kinds of site: a JS declaration, a template literal's interpolation, CSS
injected as a string, and an SVG presentation attribute in `prop="value"` form. An expression
binding, `r={hover ? 5 : 4}`, is outside all of them. A literal reached through an
intermediate local variable is still caught, but only when that identifier is used bare (no
member access, no call, no arithmetic) at the governed site.

It scans `.jsx`, `.ts` and `.tsx` under `frameworks/`, not `.html`, and nothing under `intro/`,
so those pages stay clean only because they are tokenized by hand. The `*.card.html` specimens
under `frameworks/tailwind/` are the one family of unscanned pages that stays clean
structurally: every class they render comes from the manifest through `classesFor()`.

**Two blind spots are known and neither is fixed**: a kebab-case SVG attribute, and Angular's
`[style.x]` binding form, which sits outside all four scanners. This is why the three SVG
charts write their static styling as camelCase `[style]` **objects**: in that shape
`strokeWidth` and `fontSize` are judged as themselves, which is strictly more coverage than an
attribute.

A handful of sites are exempt by name with a reason each: read `EXEMPT` for the current set
rather than a count. A stale exemption fails the gate itself, and a change to `EXEMPT` or
`PASSTHROUGH` is a change to `check-dimension-literals.test.mjs` too, since that suite asserts
on both maps by name.

Every `X.test.mjs` beside a gate covers that gate. Two suites here name no gate:
`browser-modules.test.mjs` covers the `intro/` runtime modules, and
`components-categories.test.mjs` covers `frameworks/Components.json`, and both are claims about
the repository root, which is what makes them `arena`.
