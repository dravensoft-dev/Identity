# scripts/build/tailwind/

| script | emits | why it exists |
| --- | --- | --- |
| `build-tailwind.mjs` | `frameworks/tailwind/Utilities.generated.css` and `components/**/*.manifest.generated.ts` | Compiles the `@theme` preset with the manifests as content, so every utility a manifest names is a real rule; and re-emits each `.manifest.json` as a typed module, which is the form `<Component>.variants.ts` imports. |

**One script, two tracking states, and the split is by audience.** The manifest modules are
tracked: an Angular `.variants.ts` imports one, so they are source for anyone adopting that
layer, and `ngc` needs them before the test surface will compile. `Utilities.generated.css` is
git-ignored: only the specimen pages link it, and an adopter imports
`frameworks/angular/theme/arena-tailwind.css` and compiles their own. `check:generated` holds
that distinction; `check:tailwind-generated` compares both against a fresh compile.

Every `X.test.mjs` beside a script covers that script.
