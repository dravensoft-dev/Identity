/*
 * Loads .jsx modules in the browser with no build step: transforms each
 * file with Babel standalone (JSX -> JS) and rewrites its relative
 * imports to already-transformed blob URLs, recursively. Bare
 * specifiers (e.g. 'react') are left untouched so the page's
 * <script type="importmap"> can resolve them.
 */
(function () {
  const blobUrlCache = new Map();
  const pending = new Set();
  const RELATIVE_IMPORT_RE = /((?:import|export)[^'"]*?from\s*['"])(\.{1,2}\/[^'"]+)(['"])/g;

  async function loadBlobUrl(absoluteUrl) {
    if (blobUrlCache.has(absoluteUrl)) return blobUrlCache.get(absoluteUrl);

    const promise = (async () => {
      const res = await fetch(absoluteUrl);
      if (!res.ok) throw new Error(`jsx-loader: failed to load ${absoluteUrl} (${res.status})`);
      const source = await res.text();
      const { code } = Babel.transform(source, {
        presets: ['react'],
        sourceType: 'module',
        filename: absoluteUrl,
      });

      const deps = new Set();
      for (const match of code.matchAll(RELATIVE_IMPORT_RE)) deps.add(match[2]);

      let finalCode = code;
      for (const dep of deps) {
        const depAbsoluteUrl = new URL(dep, absoluteUrl).href;
        const depBlobUrl = await loadBlobUrl(depAbsoluteUrl);
        finalCode = finalCode.split(`'${dep}'`).join(`'${depBlobUrl}'`).split(`"${dep}"`).join(`"${depBlobUrl}"`);
      }

      const blob = new Blob([finalCode], { type: 'text/javascript' });
      return URL.createObjectURL(blob);
    })();

    blobUrlCache.set(absoluteUrl, promise);
    return promise;
  }

  window.arenaImport = async function arenaImport(specifier) {
    const absoluteUrl = new URL(specifier, location.href).href;
    const load = (async () => {
      const blobUrl = await loadBlobUrl(absoluteUrl);
      return import(blobUrl);
    })();
    pending.add(load);
    try {
      return await load;
    } finally {
      pending.delete(load);
    }
  };

  /* Resolves once no arenaImport is in flight and the browser has painted
   * twice. Added for scripts/check-card-viewports.mjs, which measures these
   * pages and would otherwise have to guess at a fixed wait.
   *
   * It is a floor, not a promise of "fully rendered": a page whose module
   * has not started yet has nothing pending, so this resolves at once. The
   * gate follows it with a stability poll for exactly that reason. */
  window.arenaReady = async function arenaReady() {
    while (pending.size) await Promise.allSettled([...pending]);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };
})();
