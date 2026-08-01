# scripts/generate/arena/

| script | emits | why it exists |
| --- | --- | --- |
| `generate-tokens.mjs` | `contracts/design-generated/*.generated.css`, `Tokens.generated.*` in both framework layers, and `frameworks/tailwind/Breakpoints.generated.css` | DTCG JSON is the only place a design value is authored. This turns it into the four CSS files `intro/styles.css` imports, and, for a token flagged `$extensions["com.dravensoft.arena"].script`, into a bare number each layer can do arithmetic with. The breakpoints go a third way, as Tailwind `--breakpoint-*` literals, because a media query condition holds no `var()`. It also derives `catSlots` from the `--color-cat-*` ramp, which is the count `contracts/api/types/cat-slot.json` must agree with. |
| `generate-api-types.mjs` | `Api.generated.*` in both framework layers | A shared object or enum is declared once in `contracts/api/types/` and emitted per layer, so a component's import never crosses the `contracts/api/` ↔ `frameworks/` boundary. |

Both are `arena` rather than `core` because both **write into two framework layers**, however
much their input lives under `contracts/`. The domain is decided by what a script touches.

Of what these two scripts emit, only the CSS is tracked: `contracts/design-generated/` is
served to a browser straight from the git tag the Claude Code plugin is installed from, while
everything either script writes under `frameworks/` is git-ignored and rebuilt by
`bun run build`. `check:tokens`, `check:script-tokens` and `check:api` compare the files on
disk against a fresh emit.

Every `X.test.mjs` beside a script covers that script.
