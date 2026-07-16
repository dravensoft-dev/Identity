/*
 * Carga módulos .jsx en el navegador sin paso de build: transforma cada
 * archivo con Babel standalone (JSX -> JS) y reescribe sus imports
 * relativos a blob URLs ya transformadas, de forma recursiva. Los
 * specifiers "bare" (p. ej. 'react') se dejan intactos para que los
 * resuelva el <script type="importmap"> de la página.
 */
(function () {
  const blobUrlCache = new Map();
  const RELATIVE_IMPORT_RE = /((?:import|export)[^'"]*?from\s*['"])(\.{1,2}\/[^'"]+)(['"])/g;

  async function loadBlobUrl(absoluteUrl) {
    if (blobUrlCache.has(absoluteUrl)) return blobUrlCache.get(absoluteUrl);

    const promise = (async () => {
      const res = await fetch(absoluteUrl);
      if (!res.ok) throw new Error(`jsx-loader: no se pudo cargar ${absoluteUrl} (${res.status})`);
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
    const blobUrl = await loadBlobUrl(absoluteUrl);
    return import(blobUrl);
  };
})();
