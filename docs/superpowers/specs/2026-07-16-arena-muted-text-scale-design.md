# Arena — retiring the faint text level, and the light theme's contrast debt

**Date:** 2026-07-16 · **Status:** approved, ready for planning · **Target:** v1.2.0 · **Depends on:** v1.1.0 (see Sequencing)

Two WCAG failures in the light theme, one root cause. This spec retires the token behind the first, gives the second an owner, and ships the check that would have caught both.

Found while measuring type tokens during Arena v1.1 planning. It is **not** part of v1.1 — that release is a component-gap minor and folding this in would have descoped it.

## The finding

| # | Failure | Dark | Light | Bar |
|---|---|---|---|---|
| 1 | `--text-faint` / `--mute-2` as body text, on the card surface | 4.93:1 ✓ | **3.46:1 ✗** | 4.5:1 (WCAG 1.4.3, normal text) |
| 2 | `Avatar`'s `offline` status dot (`--mute-2-disabled`), on the card surface | 3.47:1 ✓ | **2.47:1 ✗** | 3:1 (WCAG 1.4.11, graphical object) |

Measured against the real surfaces (`--color-base-200`: `#1d1715` dark, `#f7f4ef` light) with the same `contrast()` implementation Arena vendors for its palette validator. Values are the `color-mix` derivations composited over the surface.

**Not a failure, and staying that way:** `--mute-2-disabled` on `Pagination`'s disabled controls (2.47:1 light). Inactive user-interface components are explicitly exempt from 1.4.3 and 1.4.11. Low contrast there is not a defect — it *is* the affordance.

### Root cause

Arena is dark-first. Review 3 recalibrated `--mute-2` to 52% by measuring against the dark background, published the result in `README.md:131` as "recalibrated to **WCAG AA**", and the light theme was never re-measured. The `color-mix` derivations live in a single shared `:root,.arena-light` block, so a percentage tuned for dark is applied verbatim to light, where the usable range is narrower.

Nothing caught it because **the README's AA claim was never machine-checkable**. It was verified by eye, once, in one theme. That — not the two numbers — is what this spec closes.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Retire `--text-faint` / `--mute-2` rather than fix them** | No component in the repo consumes them — the level is dead API. And it cannot be fixed as specified: clearing AA in light needs 61% of `--color-base-content`, while `--mute` already sits at 62%. There is no room for a distinguishable level below `--text-muted` in the light theme. A level that does not fit and that nobody uses is debt, not API. |
| 2 | **Deprecate in 1.x, delete in 2.0** | They are public API of the copy-in kit. Removing them outright breaks external consumers *silently* — an unresolved `var()` inherits or falls back to transparent rather than erroring, which is the worst way to break. Aliasing them to the surviving level fixes the contrast immediately and buys a migration window. The project states it follows SemVer; this honors it. |
| 3 | **The offline dot gets its own token, `--status-offline`** | `--mute-2-disabled` currently serves two masters that want opposite things: "disabled" (where low contrast is desirable and exempt) and "offline" (where low contrast is a 1.4.11 failure). Raising the shared token to fix `Avatar` would make `Pagination`'s disabled text read as enabled — breaking a real affordance to fix a dot. One token, one owner. |
| 4 | **`--status-offline` is 52%** | It clears 3:1 in both themes (4.93 dark / 3.46 light) with margin over the 48% the light theme requires. 52% is exactly the value `--mute-2` vacates, so the retired level's calibration is reused rather than a new number invented. |
| 5 | **The check ships in the repo** | Decision 1 exists because a published AA claim went unverified for a whole theme. Fixing the numbers without shipping the assertion re-arms the same trap. This mirrors `check-ramp.mjs`, which v1.1 ships for the same reason. |
| 6 | **Scope stops at the faint family** | Both findings share a root cause, a file, and a verification pass; splitting them would mean measuring `colors.css` twice. A systematic audit of the whole light theme is a different, unscoped piece of work — see Out of scope. |

## Token layer

All changes are in `tokens/colors.css` (the structure file — after v1.1 it holds the derivations, and the skin lives in `palette.css`).

| Token | Today | Becomes | Why |
|---|---|---|---|
| `--mute-2` | `color-mix(… 52%, transparent)` | `var(--mute)` | Deprecated alias. Instantly legible (6.52 dark / 4.71 light), AA in both themes. |
| `--text-faint` | `var(--mute-2)` | `var(--text-muted)` | Deprecated alias. |
| `--status-offline` | — | `color-mix(in oklab, var(--color-base-content) 52%, transparent)` | New. Presence "offline" only. |
| `--mute-2-disabled` | `color-mix(… 40%, transparent)` | unchanged | Disabled text. Exempt, and must look inactive. |

Both deprecated tokens carry a comment naming their replacement and their removal version.

The muted text scale that survives — three levels, every one AA on both surfaces in both themes:

| Token | Derivation | Dark (base-200) | Light (base-200) |
|---|---|---|---|
| `--text-strong` | `--color-base-content` | 15.23:1 | 15.86:1 |
| `--text-body` (`--bone-dim`) | 82% | 10.46:1 | 9.28:1 |
| `--text-muted` (`--mute`) | 62% | 6.52:1 | 4.71:1 |

`--text-muted` in light (4.71:1) is the tightest survivor. It clears AA, but it is the reason nothing fits below it — and the reason the verification script must gate it rather than assume it.

## Components

`components/display/Avatar.jsx:3` — the `STATUS` map's `offline` entry moves from `var(--mute-2-disabled)` to `var(--status-offline)`. Nothing else changes: the dot already carries `aria-label` and `title`, so the state was never color-alone (1.4.1 was fine); only its contrast was failing.

No other component reads a retired token. The system's entire visual change is one line.

## Documentation

- **`README.md:73`** — the derived-levels list (`--bone-dim`, `--mute`, `--mute-2`) drops `--mute-2` and gains `--status-offline`.
- **`README.md:131`** — **this line is currently false and must be corrected, not just updated.** It claims review 3 recalibrated `--mute-2` to WCAG AA. That was true of the dark theme only; light was left at 3.54:1. Correct it to say so, and note the level is retired here. It is a correction of the record, not a deletion of it.
- **`README.md`** — a deprecations note: `--mute-2` and `--text-faint` are aliases as of 1.2.0, removed in 2.0; use `--text-muted`. Document `--status-offline` as presence-only, with its measured numbers.
- **`CHANGELOG.md`** — a 1.2.0 entry with `### Deprecated` and `### Fixed`.
- **`reference/Arena - Overview.dc.html:394` is NOT touched.** It describes what review 3 did at the time, and it is approved reference material. The README is the normative spec and is where the correction belongs; rewriting the example app's history is not a fix.

## Verification

**`scripts/check-text-contrast.mjs`** — sibling of `check-ramp.mjs`, same philosophy: read the tokens out of the CSS, measure, exit non-zero on failure. It must not hardcode the values it is checking.

- Reads the surfaces from `tokens/palette.css` and the derivation percentages from `tokens/colors.css`.
- Resolves every text level over `--color-base-100` and `--color-base-200`, in both themes.
- Gates: **4.5:1** for `--text-strong` / `--text-body` / `--text-muted`; **3:1** for `--status-offline`.
- `--mute-2-disabled` is reported but **not gated**, with the exemption named in the output — so the next reader learns why it is low instead of "fixing" it.
- Reuses the `contrast()` export from `scripts/validate-palette.mjs` (vendored by v1.1). No second implementation.

The repo has no test runner and no build. Verification is this script, plus serving the repo (`python3 -m http.server 8000` — `file://` will not work, the demos `fetch()` their JSX) and confirming in **both themes**:
- `components/display/display.card.html` and `table-avatar.card.html` — the `offline` dot still reads as absence beside `online`/`busy`/`away`, and is visible in light.
- `guidelines/colors-neutrals.html` — the text levels still read as a scale.
- `ui_kits/console/index.html` — `Pagination`'s disabled controls still look disabled.

## Sequencing

**This lands after v1.1.0.** Two hard dependencies:

1. v1.1's Task 1 rewrites `tokens/colors.css` wholesale (extracting the skin into `palette.css`). Running both against that file at once is a guaranteed conflict.
2. `check-text-contrast.mjs` imports `contrast()` from `scripts/validate-palette.mjs`, which v1.1's Task 2 vendors. Without it, this spec would have to vendor the validator itself — duplicating it.

Version → **1.2.0** in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the `README.md` header, which move together, plus the `CHANGELOG.md` entry. Adding a token and deprecating two is a minor; the removal is what waits for 2.0.

## Out of scope

- **A systematic WCAG audit of the light theme.** Only these two failures were measured, because only the faint family was under the microscope. There may be more. This spec deliberately does not claim the light theme is clean — that claim would need the measurement, and the measurement has not been done. Worth its own spec.
- **Deleting the deprecated tokens.** That is 2.0, by decision 2.
- **The type scale (`--fs-*`).** WCAG sets no minimum font size and no heading-size relationship. There is no accessibility work to do there, and the question that raised it (Shell's 22px header vs `--fs-h1`'s 44px) was resolved inside v1.1.
- **`prefers-contrast` / a high-contrast theme.** Real, and much larger than this.

## Constraints that apply throughout

From `CLAUDE.md`: English only. No emoji. No raw hex in components — define the token, alias, then consume. No CSS classes; inline `style` objects reading custom properties. `README.md` is the normative spec and moves in the same change as any token or convention. The version lives in three files that must move together, logged in `CHANGELOG.md`.
