import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative } from 'node:path';
import { repoRoot } from '../arena/repo-root.ts';

export function manifestClasses(manifest): string[] {
  const out = new Set<string>();
  const eat = (v) => {
    if (typeof v === 'string') for (const c of v.split(/\s+/)) { if (c) out.add(c); }
    else if (v && typeof v === 'object') for (const child of Object.values(v)) eat(child);
  };
  eat(manifest.slots);
  eat(manifest.variants);
  return [...out].sort();
}

export function escapeClass(cls: string) {
  const backslash = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, (ch) => `\\${ch}`);
  if (/^[0-9]/.test(cls))
    return `\\${cls.codePointAt(0).toString(16)} ${backslash(cls.slice(1))}`;
  return backslash(cls);
}

export function manifestFiles(componentsDir) {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.manifest.json')) out.push(p);
    }
  };
  walk(componentsDir);
  return out.sort();
}

export function entryStylesheet(preset, components, extra?) {
  return `@import '${preset}' source(none);\n@source '${components}/**/*.manifest.json';\n`
    + (extra ? `@source '${extra}';\n` : '');
}

export function compileEntry(entry, root = repoRoot) {
  const bin = join(root, 'node_modules/.bin/tailwindcss');
  const dir = mkdtempSync(join(tmpdir(), 'arena-tw-'));
  const out = join(dir, 'out.css');
  try {
    const r = spawnSync(process.execPath, [bin, '-i', '-', '-o', out], { input: entry, encoding: 'utf8' });
    if (r.status !== 0) {
      if (r.error) throw new Error(`tailwindcss failed to spawn: ${r.error.message || r.error}`);
      throw new Error(`tailwindcss exited ${r.status}\n${r.stderr || r.stdout}`);
    }
    return readFileSync(out, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function layerManifests(root = repoRoot) {
  const components = join(root, 'frameworks/tailwind/components');
  const manifests = new Map();
  for (const p of manifestFiles(components))
    manifests.set(relative(root, p), JSON.parse(readFileSync(p, 'utf8')));
  return manifests;
}

export function compileLayer(opts: { root?: string; extraSource?: string } = {}) {
  const root = opts.root ?? repoRoot;
  const preset = join(root, 'frameworks/tailwind/Theme.css');
  const components = join(root, 'frameworks/tailwind/components');

  const manifests = layerManifests(root);
  const entry = entryStylesheet(preset, components, opts.extraSource);
  return { css: compileEntry(entry, root), manifests };
}
