#!/usr/bin/env node
/* The command an Arena consumer runs: arena.config.json in, one stylesheet out. It ships
 * inside both npm packages as bin/arena-theme.mjs, so it depends on nothing but node:fs
 * and its three siblings, and it is the only file here that reads a path or exits.
 * A configuration problem is always fatal, because a config that does not parse has no
 * output to emit. A contrast or ramp report is not: a consumer owns their brand, and
 * Arena's job is to say what it costs. --strict makes the reports fatal too. */

import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, basename, join } from 'node:path';
import { configProblems, paletteReports, themeCss } from './theme-css.mjs';

const here = dirname(fileURLToPath(import.meta.url));

export function hostPackage(dir = here) {
  try {
    const name = JSON.parse(readFileSync(join(dir, '..', 'package.json'), 'utf8')).name;
    return /^@dravensoft\/arena-/.test(name) ? name : null;
  } catch {
    return null;
  }
}

export const USAGE = [
  'usage: arena-theme <config.json> -o <output.css> [--strict] [--no-import]',
  '',
  '  <config.json>   the palettes and fonts this project declares',
  '  -o, --out       where to write the stylesheet; import it LAST, after the package',
  '  --strict        exit 1 on a contrast or ramp report, not only on a config problem',
  '  --no-import     omit the @import of the package stylesheet from the output',
].join('\n');

export function parseArgs(argv) {
  const options = { strict: false, importHeader: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--strict') { options.strict = true; continue; }
    if (arg === '--no-import') { options.importHeader = false; continue; }
    if (arg === '-o' || arg === '--out') {
      options.out = argv[++i];
      if (!options.out) return { error: `${arg} needs a path` };
      continue;
    }
    if (arg.startsWith('--out=')) { options.out = arg.slice('--out='.length); continue; }
    if (arg.startsWith('-')) return { error: `unknown flag: ${arg}` };
    if (options.config) return { error: `unexpected extra argument: ${arg}` };
    options.config = arg;
  }
  if (!options.config) return { error: 'no configuration file given' };
  if (!options.out) return { error: 'no output path given; pass -o <output.css>' };
  return options;
}

export function reportLines(reports) {
  return reports.flatMap(({ palette, messages }) => messages.map((m) => `arena-theme: ${palette}: ${m}`));
}

export function main(argv, packageName) {
  const options = parseArgs(argv);
  if (options.help) { console.log(USAGE); return 0; }
  if (options.error) { console.error(`arena-theme: ${options.error}\n\n${USAGE}`); return 2; }

  let config;
  try {
    config = JSON.parse(readFileSync(options.config, 'utf8'));
  } catch (error) {
    console.error(`arena-theme: cannot read ${options.config}: ${error.message}`);
    return 2;
  }

  const problems = configProblems(config);
  if (problems.length) {
    for (const problem of problems) console.error(`arena-theme: ${problem}`);
    return 1;
  }

  const lines = reportLines(paletteReports(config));
  for (const line of lines) console.error(line);

  const css = themeCss(config, { packageName, importHeader: options.importHeader, source: basename(options.config) });
  mkdirSync(dirname(options.out), { recursive: true });
  writeFileSync(options.out, css);
  console.log(`arena-theme: wrote ${options.out} (${css.length} bytes)`);

  return options.strict && lines.length ? 1 : 0;
}

const invokedAs = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (invokedAs === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), hostPackage() ?? '@dravensoft/arena-react'));
}
