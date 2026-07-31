# scripts/build/angular/

| script | emits | why it exists |
| --- | --- | --- |
| `build-angular-demo.mjs` | `build/angular-demo/js/*.card.entry.js` | Two steps, because neither tool does the other's job: `ngc` compiles the templates AOT into ESM that still carries bare `@angular/*` specifiers and extensionless relative imports, and `Bun.build` resolves both into something a browser loads. `splitting` keeps the Angular runtime in one shared chunk across every page. |
| `build-angular-tests.mjs` | `build/angular-test/` | The Angular suites run against the AOT emit, never against the `.ts` sources, so a template diagnostic in an inline `template:` string fails the *build* and no test in that run executes. It also prunes output whose source has been deleted, because `ngc`'s incremental build does not. |

| `build-angular-package.mjs` | `frameworks/angular/dist/` | Assembles `@dravensoft/arena-angular` in Angular Package Format. ng-packagr infers `rootDir` from the entry file's directory and refuses a source outside it, while every `.variants.ts` imports a Tailwind manifest four directories up, so the layer is staged AT `build/angular-package/` with that slice of `frameworks/tailwind/` beside it and each specifier repointed to its new depth. The staging tree is the whole reason this is not two lines. |

The first two write into git-ignored `build/`, so neither carries the `.generated.` infix: the
directory already says it. `build-angular-demo.mjs` is part of `bun run build`;
`build-angular-tests.mjs` is not, because `bun run test` and `bun run check` run it themselves
immediately before the suites that read it, which is what prevents staleness there.
`build-angular-package.mjs` is part of `bun run build:packages` rather than `bun run build`,
since a package is for publishing and nothing in this repository reads one.

Every `X.test.mjs` beside a script covers that script.
