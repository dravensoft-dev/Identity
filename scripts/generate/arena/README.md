# scripts/generate/arena/

| script | emits | why it exists |
| --- | --- | --- |
| `generate-tokens.mjs` | `contracts/design-generated/*.generated.css`, `Tokens.generated.*` in both framework layers, and `frameworks/tailwind/Breakpoints.generated.css` | DTCG JSON is the only place a design value is authored. This turns it into the four CSS files `intro/styles.css` imports, and, for a token flagged `$extensions["com.dravensoft.arena"].script`, into a bare number each layer can do arithmetic with. The breakpoints go a third way, as Tailwind `--breakpoint-*` literals, because a media query condition holds no `var()`. It also derives `catSlots` from the `--color-cat-*` ramp, which is the count `contracts/api/types/cat-slot.json` must agree with. |
| `generate-api-types.mjs` | `Api.generated.*` in both framework layers | A shared object or enum is declared once in `contracts/api/types/` and emitted per layer, so a component's import never crosses the `contracts/api/` ↔ `frameworks/` boundary. |
| `generate-catalog.mjs` | `frameworks/Catalog.generated.md` | The one document that answers "which components exist, what does each take, which layers ship it" in a single read, instead of a `find` and fifty file opens. Every column is derived, from `frameworks/Components.json`, each component's API contract, each layer's directory and each layer's behaviour binding, so the catalog cannot disagree with the contracts. A hand-written index would be the one shape `DOUBTS.md` refuses: nothing fails when it stops being true. |

All three are `arena` rather than `core` because each **writes into a framework layer or
across two**, however much its input lives under `contracts/`. The domain is decided by what a
script touches.

Two of the three emit something tracked, and for the same reason: the git tag the Claude Code
plugin is installed from hands the file to a reader directly, and nothing runs a build there.
`contracts/design-generated/` is served to a browser, and `frameworks/Catalog.generated.md` is
read by whoever is deciding which component to reach for. Everything else these scripts write
under `frameworks/` is git-ignored and rebuilt by `bun run build`. `check:tokens`,
`check:script-tokens`, `check:api` and `check:catalog` compare the files on disk against a
fresh emit.

Every `X.test.mjs` beside a script covers that script.
