# scripts/lib/tailwind/

| module | why it exists |
| --- | --- |
| `tailwind-compile.mjs` | Compiles the `@theme` preset with the manifests as content, and expands a manifest into the flat class list that compile needs. Here rather than inside `build-tailwind.mjs` because four gates read it as well (`check:tailwind`, `check:tailwind-generated`, `check:coverage` and `check:radius`) and a gate reaching into a build script would be the wrong direction. |
| `sheet-split.mjs` | Cuts the compiled sheet at its `@layer base` block, so a package can ship the preflight separately from what an adopter's own Tailwind would collide with. Read by both package assemblers. |
| `manifest-surfaces.mjs` | Which contracted components each manifest draws (`MANIFEST_COVERS`) and which draw themselves (`HAND_DRAWN`). Here because `check:appearance` and `check:states` both read it and either owning it would make the two import each other. |
| `theme-namespaces.mjs` | Which Tailwind theme namespace a property in `Theme.css` belongs to. The native set comes from `tailwind-merge`, which is the only correct source and the reason that package stays a devDependency; the module header says why deriving it from Tailwind's own theme file does not work. |

Every `X.test.mjs` beside a module covers that module. `tailwind-vocabulary.test.mjs` covers
the same module from the vocabulary side: which utility families the preset is expected to
emit at all.
