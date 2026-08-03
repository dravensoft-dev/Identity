# Executing the per-component CSS tree

The design is
[`docs/superpowers/specs/2026-08-03-tailwind-css-tree-design.md`](../specs/2026-08-03-tailwind-css-tree-design.md).
This plan is the order the work lands in and the assertions that move with each step. Both
documents are deleted once executed, so anything worth keeping goes to a gate, a suite, a
normative README or a `.prompt.md` before then.

**Nothing is released until step 12.** `arena.css` keeps importing `css/utilities.css` while
any component still renders raw utilities, so the collision the whole change exists to remove
is not closed until the forty-third component.

---

## Step 0 · Preparation

Five things that either block the pilot or make it undemonstrable.

**`CLAUDE.md` is at 59,961 of 60,000 characters.** Thirty-nine left, and `check:docs` fails
hard rather than warning. The Tailwind coupling paragraph moves into
`frameworks/PACKAGING.md` with a pointer left behind, before a single new line is written
anywhere. Measure with `node -e "console.log(require('fs').readFileSync('CLAUDE.md','utf8').length)"`
and never with `wc -m`.

**Release routing does not reach React.** `PACKAGE_INPUTS.react` in
`scripts/ci/arena/package-inputs.mjs` and `LAYER_INPUTS.react` in
`scripts/ci/arena/changed-layers.mjs` do not list `frameworks/tailwind/`. Today a
manifest-only edit touches nothing but gitignored files under `frameworks/react/`, so the
React package never republishes on a manifest change and its CI job never runs. After this
change the entire React appearance lives under `frameworks/tailwind/`, so both are one line
plus a reason string. `LAYER_INPUTS.angular`'s existing reason names the `.variants.ts`
import and goes false in step 9 while the routing stays correct; it is reworded there.

**Three assertions have to leave `tv-merge.test.mjs` before it dies.** The `PREFIX`/`SKIP`
namespace attribution test, the `UNATTRIBUTED` map and the fake-key escape test are not about
`tailwind-merge`; they are the only completeness guard `Theme.css` has. They move to their
own suite now, while the thing they guard is untouched.

**`check:packages` does not verify `css/*`.** `exportProblems()` filters targets containing
`*`, so a missing `css/` file ships green. Widen it before the CSS surface goes from two
files to forty-five.

**The React package ships no `Animations.css`, `Numerals.css` or `Theme.css`**, all three of
which Angular ships. Seven animations and their `prefers-reduced-motion` redefinitions are
absent from `@dravensoft/arena-react` today, silently. `css/prelude.css` repairs it in step 3;
record it as an outcome rather than letting it look like a side effect nobody noticed.

## Step 1 · The compile stage

`scripts/build/tailwind/build-tailwind.mjs` gains manifest-to-`@apply` generation, a compile
through the pinned CLI, the strip, and emission of `<Component>.styles.generated.css`.

The strip rewrites `var(--A, var(--B))` to `var(--B)` to a fixed point and is **validated
against `Theme.css`**: `--A` must be a key of the `@theme` block and `--B` the token that key
resolves to. A fallback of any other shape is left alone. An unrecognised pair is an error
and not a pass-through, because a silent skip is exactly the failure the strip exists to
prevent.

Class names come from `MANIFEST_COVERS`, never from the component name. `compoundVariants`
emit as `--cv<n>` after every simple variant.

## Step 2 · `ArenaStyles.ts` and the mirrored modules

`frameworks/tailwind/ArenaStyles.ts` replaces `Tv.ts`, preserving `styles.root()`, and
implements `compoundVariants` because `PageHead` has two.

`buildRecipeRuntime()` and the per-component `<Component>.classes.generated.ts` mirror into
both layers: `CONSUMING_LAYERS` becomes `['react', 'angular']`. The generated module is
`as const`, because `Badge`, `Avatar`, `Alert` and `Toast` derive types from `Object.keys`
over its variant groups.

Keeping `ArenaStyles` generated rather than authored per layer keeps it out of
`check:duplicate-constants`, whose `sourceFiles()` skips `.generated.` for exactly this
reason, and it must **not** join `PAIRED` in `check:shared-arithmetic`, because
`check:tailwind-generated` already holds it to its single source. Record that where someone
about to add it will read it.

## Step 3 · Assembly

`scripts/lib/arena/package-assembly.mjs`: `sheetHalves()` narrows to extracting the preflight
alone, and a new function collects the emitted component CSS into `css/components/`, writes
the `css/components.css` barrel and writes `css/prelude.css` with the layer order, the
`@property --tw-*` registrations and the keyframes.

**`CSS_CHAIN` is not touched.** `package-assembly.test.mjs` asserts its last two entries by
literal value, so everything new arrives through `extra`. `arenaCssHeader()` is the only
place the import order is explained and it gains the new entries.

Each `css/components/<name>.css` opens with `@import '../prelude.css';` so that importing one
component alone is safe.

`sheet-split.mjs` survives as the preflight extractor. Its `utilities` half, the
"one half would ship empty" guard whose reasoning becomes moot, `SHEET_BANNERS.utilities` and
five of the ten tests in `sheet-split.test.mjs` go with it.

## Step 4 · The pilot

`Badge` is the simple case, `Input` the state case, `Calendar` the compound case and the
largest at 26 slots. **Both layers in the same commit**, because `check:parity` compares the
two layers' rendered pages and a one-layer migration leaves it red.

## Step 5 · `check:component-css`

Bidirectional over manifest and emitted CSS, plus the assertion that no emitted file
references a Tailwind namespace property, which is what proves the strip ran. Excludes the
seven `arena-*` utilities `Animations.css` declares, verified by name:
`arena-shimmer`, `arena-pop`, `arena-menu`, `arena-fade`, `arena-prog-indeterminate`,
`arena-btn-spin`, `arena-spinner`.

## Step 6 · `check:style-parity`

Headless Chromium, with `Utilities.generated.css` as the oracle. It renders the
concatenations the components produce, not one slot per element, and it drives the media
queries. The 43 `*.card.html` specimens are the cheapest harness: same manifests, same page
shape, already inside `check:cards`' walk.

Both gates join `GATES`, taking it from 40 to 42. `check-all.test.mjs` asserts the length,
the literal name array and the `CI_JOBS` partition, and all three move in this commit. The
`tailwind` domain goes from 6 gates to 8, and `check:style-parity` joins the set needing a
browser, which the two README tables state and currently disagree about.

## Step 7 · The sweep

The remaining forty, two layers per commit.

## Step 8 · Packaging

`build-angular-package.mjs` loses `repointTailwind()`, `TAILWIND_SPECIFIER` and the loop
staging `frameworks/tailwind/**/*.ts`. `RUNTIME_DEPENDENCIES` narrows to `tslib`. The staging
tree stays, because it is still where `ng-package.json`, `tsconfig.lib.json` and the staged
`package.json` are written without polluting the tracked layer, but the file header's
justification becomes false and is rewritten around the reason that remains.

`build-react-package.mjs` swaps `Tv.generated.ts` for `ArenaStyles.generated.ts` in `ROOT_TS`
and gains the component CSS collection.

`build-vendor.mjs` and the importmap in `playground-react.mjs` drop the two vendored bundles.

## Step 9 · The edge

`ALLOWED` and `ALLOWED_SPECIFIERS` empty; `check-layer-independence.test.mjs` asserts both by
literal value. `frameworks/angular/tsconfig.check.json` and `tsconfig.demo.json` carry
`"rootDir": ".."` solely for the four-directory import, and leaving it open keeps the escape
hatch with the gate green.

## Step 10 · Internal consumers of the class string

`classesFor()` returns Arena names and the 43 specimens link the component CSS, which is what
makes them the parity harness. `playground-react.mjs` and `playground-angular.mjs` hard-code
a `<link>` to `Utilities.generated.css`; `check:playgrounds` byte-compares against a fresh
run, so all 110 pages move in one commit. `build-demos.mjs` names `Tv.generated.ts` by
literal path. `drift()` in `check-tailwind-generated.mjs` knows two output families and needs
both new ones, or the new artifacts have no drift gate at all.

**The Delivery Console links no utility sheet at all**, so it renders every Arena component
with unresolved classes today and no gate covers it. One `<link>` to `components.css`.

`check:generated` gains `UNTRACKED` entries with reasons, and `.gitignore` the matching
patterns.

## Step 11 · Documentation

The blast radius is in the design document. Three claims are **already false today** and are
corrected rather than carried:

- `frameworks/tailwind/README.md` says `classesFor()` throws on `compoundVariants` by design.
  It implements them, three tests prove it, and `PageHead` uses them.
- The same file lists "eight source files" at the layer root; there are nine.
- `scripts/check/README.md` says the `arena` domain holds 17 gates; it holds 21. Its
  "five gates need a browser" list and `CLAUDE.md`'s disagree about which five.

`frameworks/angular/PACKAGE.md`'s line offering to compile the utilities from
`css/theme-preset.css` with a `@source` at the package becomes **false and silent**: no file
in the package carries a class string afterwards, so that `@source` compiles an empty sheet
and the adopter gets an unstyled library with no error. It is replaced, not deleted.

`SKILL.md` and `frameworks/PACKAGING.md` restate that the class name is not the API.
`UnauthCard.prompt.md`'s example uses `p-gutter`, an Arena-only utility no adopter will have.

## Step 12 · Release

`bun run check` in full. Then the five surfaces a release moves, in the release commit, then
the tag.

---

## Verification

| what | how |
|---|---|
| the strip ran | `check:component-css` asserts no Tailwind namespace property in any emitted file |
| appearance is unchanged | `check:style-parity`, over real slot concatenations and inside the media queries |
| compact density is repaired | an `Input` inside `.arena-compact` renders at the compact control height, which it does not today |
| both layers still agree | `check:parity`, which is why every component migrates in both layers at once |
| weight | gzip of the assembled `dist/`, against the design document's table, measured and not estimated |
