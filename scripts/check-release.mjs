import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

let ok = true;
const results = [];

const check = (name, pass, detail, gate = true) => {
  if (!pass && gate) ok = false;
  results.push([gate ? (pass ? 'PASS' : 'FAIL') : 'INFO', name, detail]);
  return pass;
};

const plugin = readJSON('.claude-plugin/plugin.json');
const marketplace = readJSON('.claude-plugin/marketplace.json');

const version = plugin.version;
const tag = `v${version}`;
console.log(`\nRelease under test: ${tag}  (from .claude-plugin/plugin.json, the version Claude Code resolves first)`);

const entry = marketplace.plugins?.find((p) => p.name === plugin.name);
if (!check('marketplace entry', !!entry, entry ? `"${plugin.name}" found` : `no plugin named "${plugin.name}" in marketplace.json`)) {
  report();
}

check('marketplace version', entry.version === version, `${entry.version ?? '(unset)'} — plugin.json says ${version}`);

const readme = read('README.md').match(/^\*\*Version\s+(\S+)\*\*/m);
check('README header', readme?.[1] === version, readme ? `${readme[1]}` : 'no "**Version X.Y.Z**" header found');

const headings = [...read('CHANGELOG.md').matchAll(/^## \[([^\]]+)\]/gm)].map((m) => m[1]);
const released = headings.find((h) => h.toLowerCase() !== 'unreleased');
check('CHANGELOG top entry', released === version,
  released
    ? `[${released}]${headings[0] !== released ? ` — [${headings[0]}] sits above it, which is fine` : ''}`
    : 'no "## [X.Y.Z]" entry found');

const source = entry.source;
const pinned = source && typeof source === 'object';
check('source is pinned', pinned,
  pinned ? `${source.source}:${source.repo}` :
    `"${source}" — a string source resolves against the marketplace's own checkout (the default branch), so a version would not identify a tree`);

if (pinned) {
  check('source.ref names the tag', source.ref === tag, `ref "${source.ref ?? '(unset)'}" — expected "${tag}"`);
}

const commit = git('rev-list', '-n1', tag);
if (check('tag exists', !!commit, commit ? `${tag} -> ${commit.slice(0, 7)}` : `${tag} not found — the release commit is not tagged yet`)) {
  const type = git('cat-file', '-t', git('rev-parse', tag) ?? '');
  check('tag is annotated', type === 'tag', `${type ?? 'unknown'} — v1.0.0 set the convention: git tag -a ${tag} -m "Arena ${tag}"`, false);

  const atTag = git('show', `${tag}:.claude-plugin/plugin.json`);
  if (check('plugin.json at the tag', !!atTag, atTag ? '' : `cannot read .claude-plugin/plugin.json at ${tag}`)) {
    let tagged = null;
    try { tagged = JSON.parse(atTag).version; } catch {  }
    check('THE PIN SERVES THIS VERSION', tagged === version,
      tagged === version
        ? `${tag} hands out ${tagged}`
        : `${tag} hands out ${tagged ?? '(unparseable)'}, but the marketplace advertises ${version} — nobody would ever be offered this release, and nothing would error`);
  }

  if (pinned && source.sha) {
    check('source.sha matches the tag', source.sha === commit, `sha ${source.sha.slice(0, 7)} — ${tag} is ${commit.slice(0, 7)}; sha is the effective pin when both are set`);
  }

  const onMain = git('merge-base', '--is-ancestor', commit, 'origin/main') !== null;
  check('tag is on origin/main', onMain, onMain ? `${commit.slice(0, 7)} is reachable from origin/main` : `${commit.slice(0, 7)} is not on origin/main — users fetch the tag from the published repo`, false);
}

report();

function report() {
  console.log('');
  for (const [glyph, name, detail] of results) {
    console.log(`  [${glyph}] ${name.padEnd(30)} ${detail}`);
  }
  console.log(ok
    ? `\nRelease OK — ${tag} is tagged, pinned, and hands out ${version}.\n`
    : '\nRelease FAILED — fix the marked checks before publishing.\n');
  process.exit(ok ? 0 : 1);
}
