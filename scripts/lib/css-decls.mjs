export function parseDecls(cssText) {
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map();
  for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    const decls = out.get(selector) ?? new Map();
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i === -1) continue;
      const name = d.slice(0, i).trim();
      if (!name.startsWith('--')) continue;
      decls.set(name.slice(2), d.slice(i + 1).trim());
    }
    out.set(selector, decls);
  }
  return out;
}
