# scripts/generate/arena/

| script | emits | why it exists |
| --- | --- | --- |
| `generate-tokens.mjs` | `contracts/design-generated/*.generated.css` and `Tokens.generated.*` in both framework layers | DTCG JSON is the only place a design value is authored. This turns it into the four CSS files `intro/styles.css` imports, and — for a token flagged `$extensions["com.dravensoft.arena"].script` — into a bare number each layer can do arithmetic with. It also derives `catSlots` from the `--color-cat-*` ramp, which is the count `contracts/api/types/cat-slot.json` must agree with. |
| `generate-api-types.mjs` | `Api.generated.*` in both framework layers | A shared object or enum is declared once in `contracts/api/types/` and emitted per layer, so a component's import never crosses the `contracts/api/` ↔ `frameworks/` boundary. |

Both are `arena` rather than `core` because both **write into two framework layers**, however
much their input lives under `contracts/`. The domain is decided by what a script touches.

Both outputs stay tracked: they are payload a consumer copies, and the Claude Code plugin is
served from the git tag. `check:tokens`, `check:script-tokens` and `check:api` compare the
committed files against a fresh emit.

Every `X.test.mjs` beside a script covers that script.
