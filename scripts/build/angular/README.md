# scripts/build/angular/

| script | emits | why it exists |
| --- | --- | --- |
| `build-angular-demo.mjs` | `build/angular-demo/js/*.card.entry.js` | Two steps, because neither tool does the other's job: `ngc` compiles the templates AOT into ESM that still carries bare `@angular/*` specifiers and extensionless relative imports, and `Bun.build` resolves both into something a browser loads. `splitting` keeps the Angular runtime in one shared chunk across every page. |
| `build-angular-tests.mjs` | `build/angular-test/` | The Angular suites run against the AOT emit, never against the `.ts` sources, so a template diagnostic in an inline `template:` string fails the *build* and no test in that run executes. It also prunes output whose source has been deleted, because `ngc`'s incremental build does not. It skips the compile entirely when no input has moved since the last one, which is what makes it cheap enough to run before every suite; `--force` compiles anyway. |

| `build-angular-package.mjs` | `frameworks/angular/dist/` | Assembles `@dravensoft/arena-angular` in Angular Package Format. ng-packagr infers `rootDir` from the entry file's directory and refuses a source outside it, while every `.variants.ts` imports a Tailwind manifest four directories up, so the layer is staged AT `build/angular-package/` with that slice of `frameworks/tailwind/` beside it and each specifier repointed to its new depth. The staging tree is the whole reason this is not two lines. |

The first two write into git-ignored `build/`, so neither carries the `.generated.` infix: the
directory already says it. `build-angular-demo.mjs` is part of `bun run build`;
`build-angular-tests.mjs` is not, because `bun run test` and `bun run check` run it themselves
immediately before the suites that read it, which is what prevents staleness there. **What decides
whether it compiles is a stamp it writes after a successful emit**, never the outputs' own times:
`ngc` is incremental and leaves a file it did not change untouched, so the oldest output is as old
as the last time that one file moved and would force a compile forever. An input is every `.ts`
and `.json` under the layer, plus `package.json`, `bun.lock` and the script itself, and the stamp
records which ones it compiled as well as when: a deleted source bumps no surviving file's time,
so a comparison of timestamps alone would skip a tree that no longer holds what was compiled.
`build-angular-package.mjs` is part of `bun run build:packages` rather than `bun run build`,
since a package is for publishing and nothing in this repository reads one.

Every `X.test.mjs` beside a script covers that script.
