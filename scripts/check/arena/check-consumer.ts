/* The one gate that runs what a consumer runs. Every other package claim reads dist/ as
 * files; this spawns the CLI each package ships, from inside that package, and reads what it
 * writes. No project is scaffolded and nothing is installed: arena-to-prod resolves its own
 * root by walking up from bin/, so the assembled dist/ IS the installed package, and the
 * config is the example the package itself ships. Assembly is a prerequisite rather than a
 * step: a dist/ already there is left alone, and only a missing one is built, because
 * build:packages costs minutes and this gate costs seconds. The named sheet list is read from
 * the README the package ships, which is that layer's PACKAGE.md, so the example a migrating
 * consumer copies is the one this gate runs rather than a second copy of it here. */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { PACKAGES, distDir } from './check-packages.ts';
import { CLI_BINS } from '../../lib/arena/package-assembly.mjs';
import { THEME_SHEET, ICONS_SHEET } from '../../generate/core/arena-to-prod/arena-to-prod.mjs';

export const CLI = 'bin/arena-to-prod.mjs';
export const GLYPH = 'ph-bell';

export const SOURCES = {
  react: {
    'src/App.tsx': "import { ArenaButton, ArenaTable } from '@dravensoft/arena-react';\n"
      + "export const App = () => <ArenaButton icon=\"ph-bold ph-bell\">Go</ArenaButton>;\n",
    'src/Old.txt': 'not a source extension, so the walk never reads it\n',
  },
  angular: {
    'src/app.html': '<arena-button icon="ph-bold ph-bell">Go</arena-button>\n<arena-table></arena-table>\n',
  },
};

export const STALE = {
  react: { 'src/App.tsx': "import { Button } from '@dravensoft/arena-react';\nexport const App = () => <Button>Go</Button>;\n" },
  angular: { 'src/app.html': '<arena-nothing-at-all></arena-nothing-at-all>\n' },
};

export function assembled(layer, base = root) {
  return existsSync(join(distDir(layer, base), 'package.json'));
}

export function assemble(base = root) {
  const missing = PACKAGES.filter(({ layer }) => !assembled(layer, base)).map(({ layer }) => layer);
  if (missing.length === 0) return { built: false, missing };
  const run = spawnSync('bun', ['run', 'build:packages'], { cwd: base, encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(`check-consumer: ${missing.join(' and ')} is not assembled and build:packages failed:\n`
      + `${run.stderr ?? ''}`);
  }
  return { built: true, missing };
}

export function fixture(layer, files, stylesheet, base = root) {
  const dir = mkdtempSync(join(tmpdir(), `arena-consumer-${layer}-`));
  const example = JSON.parse(readFileSync(join(distDir(layer, base), 'arena.config.example.json'), 'utf8'));
  writeFileSync(join(dir, 'arena.config.json'), JSON.stringify({ ...example, stylesheet }, null, 2));
  for (const [rel, body] of Object.entries(files) as [string, string][]) {
    mkdirSync(join(dir, rel, '..'), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

export function runCli(layer, dir, base = root) {
  const run = spawnSync('node', [join(distDir(layer, base), CLI), '--src', 'src', '--out', 'out'],
    { cwd: dir, encoding: 'utf8' });
  const read = (name) => {
    const at = join(dir, 'out', name);
    return existsSync(at) ? readFileSync(at, 'utf8') : null;
  };
  return { status: run.status, stderr: run.stderr ?? '', theme: read(THEME_SHEET), icons: read(ICONS_SHEET) };
}

export function importedSheets(css) {
  return [...(css ?? '').matchAll(/@import '[^']*\/css\/components\/([^']+)\.css';/g)].map((m) => m[1]).sort();
}

export function mergeProblems(layer, result, base = root) {
  const problems = [];
  const bins = readdirSync(join(distDir(layer, base), 'bin')).filter((f) => f.endsWith('.mjs'));
  if (Object.keys(CLI_BINS).length !== 1) {
    problems.push(`${layer}: the package advertises ${Object.keys(CLI_BINS).length} commands. One command reads `
      + 'one config and writes both sheets; a second one is the split this major removed');
  }
  if (result.status !== 0) {
    problems.push(`${layer}: ${CLI} exited ${result.status} on a config the package itself ships:\n    ${result.stderr.trim()}`);
    return problems;
  }
  if (!result.theme) problems.push(`${layer}: one invocation wrote no ${THEME_SHEET}`);
  if (!result.icons) problems.push(`${layer}: one invocation wrote no ${ICONS_SHEET}, so the icon half of the merge is gone`);
  if (result.icons && !result.icons.includes(GLYPH)) {
    problems.push(`${layer}: ${ICONS_SHEET} names no ${GLYPH}, so the icon scan stopped reading consumer sources`);
  }
  if (bins.length === 0) problems.push(`${layer}: bin/ ships no command`);
  return problems;
}

export function renameProblems(layer, result, expected, base = root) {
  const problems = [];
  const sheet = join(distDir(layer, base), 'css', 'components', 'arena-button.css');
  if (!existsSync(sheet)) {
    problems.push(`${layer}: css/components/arena-button.css is not shipped, so the sheet stems never took the prefix`);
  } else if (!readFileSync(sheet, 'utf8').includes('.arena-button__root')) {
    problems.push(`${layer}: css/components/arena-button.css defines no .arena-button__root. The stem moved and the `
      + 'class moved with it, which is the one thing this rename promised would not happen');
  }
  const drawn = importedSheets(result.theme);
  for (const name of expected) {
    if (!drawn.includes(name)) {
      problems.push(`${layer}: "components": "auto" resolved [${drawn.join(', ')}] and not ${name}, `
        + 'so what the consumer wrote reached no sheet');
    }
  }
  return problems;
}

export function staleNameProblems(layer, result) {
  if (result.status === 0 && importedSheets(result.theme).length > 0) {
    return [`${layer}: a source naming the pre-rename symbol still resolved `
      + `[${importedSheets(result.theme).join(', ')}]. Nothing may answer to the old name: there is no alias `
      + 'and no re-export, and a consumer must hear about it from the command rather than from a blank screen'];
  }
  return [];
}

export function listProblems(layer, named, unknown, list = []) {
  const problems = [];
  if (named.status !== 0) {
    problems.push(`${layer}: the sheet list its own README documents, [${list.join(', ')}], was refused:\n    ${named.stderr.trim()}`);
  }
  if (unknown.status === 0) {
    problems.push(`${layer}: a stylesheet.components naming "button" was accepted, so a consumer's stale list `
      + 'fails at render rather than at the command');
  } else if (!unknown.stderr.includes('arena-button')) {
    problems.push(`${layer}: the refusal does not list the sheets the package ships, which is the only thing `
      + 'that tells a migrating consumer what to write instead');
  }
  return problems;
}

const AUTO = { components: 'auto', preflight: false };

export const DOCUMENTED_LIST = /"components":\s*\[([^\]]*)\]/g;

export function documented(page) {
  const lists = [...page.matchAll(DOCUMENTED_LIST)];
  if (lists.length !== 1) return { lists: lists.length, names: null };
  const names = lists[0][1].split(',').map((one) => one.trim().replace(/^"|"$/g, '')).filter(Boolean);
  return { lists: 1, names };
}

export function collect(base = root) {
  const problems = [];
  const { built } = assemble(base);
  const dirs = [];
  try {
    for (const { layer } of PACKAGES) {
      const auto = fixture(layer, SOURCES[layer], AUTO, base);
      const stale = fixture(layer, STALE[layer], AUTO, base);
      const { lists, names: list } = documented(readFileSync(join(distDir(layer, base), 'README.md'), 'utf8'));
      if (!list) {
        problems.push(`${layer}: the shipped README spells ${lists} stylesheet.components lists rather than one, `
          + 'so the example a consumer copies is either absent or shadowed by another');
        continue;
      }
      const named = fixture(layer, SOURCES[layer], { components: list }, base);
      const unknown = fixture(layer, SOURCES[layer], { components: ['button'] }, base);
      dirs.push(auto, stale, named, unknown);

      const result = runCli(layer, auto, base);
      problems.push(...mergeProblems(layer, result, base));
      problems.push(...renameProblems(layer, result, ['arena-button', 'arena-table'], base));
      problems.push(...staleNameProblems(layer, runCli(layer, stale, base)));
      problems.push(...listProblems(layer, runCli(layer, named, base), runCli(layer, unknown, base), list));
    }
  } finally {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  }
  return { problems, built };
}

function main() {
  const { problems, built } = collect();
  if (problems.length > 0) {
    console.error(`check-consumer: ${problems.length} problem(s)\n`);
    for (const one of problems) console.error(`  ${one}`);
    process.exit(1);
  }
  console.log(`check-consumer: both packages run ${CLI} from their own dist/ and resolve "auto" to the sheets `
    + `a consumer's sources name${built ? ', after assembling what was missing' : ''}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
