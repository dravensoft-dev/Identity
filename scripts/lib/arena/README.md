# scripts/lib/arena/

What belongs to no one layer: the parsers, the browser harness, and the tree's own facts.

| module | why it exists |
| --- | --- |
| `repo-root.mjs` | The repository root, derived once. Every script imports it from here rather than counting `..` from its own location, so a script's depth under `scripts/` is not part of what it has to get right. **The one place that counts**, which is why moving this file needs care. |
| `arena-scripts-vars.mjs` | Every environment variable the scripts read, declared once so a test run or a CI run needs no exports. `arenaEnv()` lays the declared values under the real environment, which wins, so a one-off override stays a shell prefix rather than an edit to a versioned file. `skipExitCode()` is the single reading of `ARENA_CHECK_STRICT` and `CI` that all four skippable gates share. |
| `layers.mjs` | `LAYERS` and the two name shapes every gate reads a layer through. An **exhaustive enumeration**, deliberately not a walk of `frameworks/`, so a layer renamed or removed wholesale becomes loud instead of quietly leaving scope. `kebab()` derives a directory name from a PascalCase one: a function, never a table. |
| `comments.mjs` | Finds comments by lexing, so a `//` inside a string, a regex or a template literal is never mistaken for one, and a `@ts-`/`eslint-` directive is a directive rather than the file's one allowance. Kept dependency-free so it runs under plain node. |
| `markdown-prose.mjs` | Splits a Markdown document into its prose runs, one per line, so the punctuation rule never judges the code a document quotes. Both skips are lexed: a fence closes only on a run of its own character at least as long as the one that opened it, and a code span only on a backtick run of exactly its own length, which may be lines below. Kept dependency-free so it runs under plain node. |
| `css-decls.mjs` | Parses a stylesheet into selector → declaration maps. Read by the token drift gate and by the Overview page, so both judge the same text the same way. |
| `api-surface.mjs` | Reads a layer's declared API surface out of source text, by regex. A shape it cannot read **throws** rather than going silently missing from the member list, because a member absent by accident and a member absent by design look identical downstream. |
| `behaviour-contracts.mjs` | Loads and validates the behaviour patterns and each layer's bindings. `bindingCases()` is the **single** place the flat and cased binding shapes are reconciled. |
| `chromium.mjs` | Finds and launches a headless browser from `CHROME_PATH` or the usual paths. Returns nothing rather than throwing when there is none, so each gate that needs one decides for itself what the absence costs. **`CHROME_PATH` is terminal, not a preference**: set and pointing at nothing, it reports that rather than falling back to the candidate list, because a path someone wrote down and a path that happens to exist are different claims. |
| `cdp.mjs` | The Chrome DevTools Protocol dispatcher the viewport gate drives the browser with. |
| `package-assembly.mjs` | What both npm package builds share: the exclusion list deciding what never ships, the copy that honours it, the CSS chain each package carries, and the manifest template that stamps the version from `plugin.json`. `arena` because it reads two framework layers and the repository root. It compiles nothing; each layer's builder does that with its own toolchain. |
| `static-server.mjs` | The static file server behind `bun run demos`, and the fixture the card gate loads pages from. Its own suite asserts a real `fetch`, which is why the DOM-free test invocation must stay DOM-free. |

Every `X.test.mjs` beside a module covers that module.
