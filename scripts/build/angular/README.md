# scripts/build/angular/

| script | emits | why it exists |
| --- | --- | --- |
| `build-angular-demo.mjs` | `build/angular-demo/js/*.card.entry.js` | Two steps, because neither tool does the other's job: `ngc` compiles the templates AOT into ESM that still carries bare `@angular/*` specifiers and extensionless relative imports, and `Bun.build` resolves both into something a browser loads. `splitting` keeps the Angular runtime in one shared chunk across every page. |
| `build-angular-tests.mjs` | `build/angular-test/` | The Angular suites run against the AOT emit, never against the `.ts` sources, so a template diagnostic in an inline `template:` string fails the *build* and no test in that run executes. It also prunes output whose source has been deleted, because `ngc`'s incremental build does not. |

Both write into git-ignored `build/`, so neither carries the `.generated.` infix — the
directory already says it. `build-angular-demo.mjs` is part of `bun run build`;
`build-angular-tests.mjs` is not, because `bun run test` and `bun run check` run it themselves
immediately before the suites that read it, which is what prevents staleness there.

Every `X.test.mjs` beside a script covers that script.
