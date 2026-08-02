# scripts/lib/angular/

What more than one script needs in order to write a template for the Angular layer.

| module | why it exists |
| --- | --- |
| `playground-angular.mjs` | Emits this layer's demo page and demo entry from the layer-neutral model in `../arena/playground-model.mjs`. A literal inside a fixture node becomes a typed class field rather than template text, because inlining it would mean escaping both the template's own quotes and the surrounding backtick's `${`. A named slot is wrapped in `@if`, because a host querying `contentChild` counts an empty marked element as filled, so blanking the text would render a header here and none in the other layer. A marker directive is read out of the layer's own source rather than listed in the emitter, so a new one joins with no edit. |

Every `X.test.mjs` beside a module covers that module.

The page itself is **not** emitted here: `../arena/playground-page.mjs` builds it for every
layer at once, because the two pages differ in exactly two lines, what mounts the app and what
the app is loaded from, and a page authored per layer would drift in its stylesheet list or its
toggle markup. A difference in the frame reads as a difference in the component, which is the
one thing these pages must never do.
