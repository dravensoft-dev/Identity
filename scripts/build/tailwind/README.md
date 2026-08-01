# scripts/build/tailwind/

| script | emits | why it exists |
| --- | --- | --- |
| `build-tailwind.mjs` | `frameworks/tailwind/Utilities.generated.css` and `components/**/*.manifest.generated.ts` | Compiles the `@theme` preset with the manifests as content, so every utility a manifest names is a real rule; and re-emits each `.manifest.json` as a typed module, which is the form `<Component>.variants.ts` imports. |

**Both outputs are git-ignored, and each has its own reader here.** A manifest module is what
an Angular `<Component>.variants.ts` imports, so `ngc` needs it on disk before the test surface
will compile at all. `Utilities.generated.css` is linked by the specimen pages alone, since an
adopter imports `frameworks/angular/theme/arena-tailwind.css` and compiles their own.
`check:generated` carries a reason for each; `check:tailwind-generated` compares both against a
fresh compile.

Every `X.test.mjs` beside a script covers that script.
