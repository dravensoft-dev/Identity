# scripts/lib/tailwind/

| module | why it exists |
| --- | --- |
| `tailwind-compile.mjs` | Compiles the `@theme` preset with the manifests as content, and expands a manifest into the flat class list that compile needs. Here rather than inside `build-tailwind.mjs` because four gates read it as well (`check:tailwind`, `check:tailwind-generated`, `check:coverage` and `check:radius`) and a gate reaching into a build script would be the wrong direction. |

Every `X.test.mjs` beside a module covers that module. `tailwind-vocabulary.test.mjs` covers
the same module from the vocabulary side: which utility families the preset is expected to
emit at all.
