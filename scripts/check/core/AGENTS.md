# scripts/check/core/

| gate | fails when |
| --- | --- |
| `check-dtcg.mjs` | a file under `contracts/design/` is not strictly-conformant DTCG 2025.10: a missing `$type`, a colour that is not a structured sRGB object, a dimension that is not a `{value,unit}` pair. |
| `check-tokens-generated.mjs` | the committed `contracts/design-generated/*.generated.css` drifts from what the DTCG source would emit: a missing selector, a changed value, or a custom property that is committed but no longer generated. |
| `check-fonts-generated.mjs` | a family declared in `contracts/design/typography.json` has no `@font-face` in `fonts.generated.css`, so a token names a font nothing loads. |
| `check-ramp.mjs` | the 8-slot categorical chart ramp stops clearing its contrast and colour-vision-deficiency gates on either surface. Run by path, with no npm script. |
| `check-text-contrast.mjs` | a text token fails contrast against the surface it is declared for, or a retired token reappears in `colors.css`; `REMOVED` names each one with the token that replaces it. Run by path, with no npm script. |

`core` because every one of these reads `contracts/` and `assets/` alone, and no framework
layer. Two are run by path rather than by npm script: they are colour-science gates whose
answer changes only when the palette does.

Every `X.test.mjs` beside a gate covers that gate.
