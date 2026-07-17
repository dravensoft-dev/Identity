/* Asserts a release is internally consistent, and above all that the plugin the
 * marketplace advertises is the plugin Claude Code will actually hand out.
 *
 * This exists because pinning the plugin to its release tag bought determinism
 * — a version now resolves to exactly one commit — at the price of a failure
 * that is completely silent. Bump the version and leave `source.ref` behind, and
 * the marketplace advertises the new version while Claude Code fetches the old
 * tag, reads the OLD plugin.json there, and resolves the OLD version. The
 * manifest's version always wins over the marketplace entry's, so the update is
 * simply never offered to anyone. Nothing errors. Nothing looks broken. The
 * release just doesn't happen, and the first hint is a user asking why they
 * still have last month's tokens.
 *
 * So the load-bearing check here is not that the version strings match each
 * other — it is that the plugin.json AT THE PINNED TAG agrees with them.
 *
 * Nothing is hardcoded: the version is read from plugin.json, which is the
 * authority (Claude Code resolves plugin.json > marketplace entry > commit SHA),
 * and everything else is compared against it.
 *
 *   node scripts/check-release.mjs   -> exit 0 if the release is coherent, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));

/** Run git, returning null instead of throwing: a missing tag is a finding to
 *  report, not a stack trace. */
function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

let ok = true;
const results = [];
/** gate=false records a finding without failing the run (reported, never gated). */
const check = (name, pass, detail, gate = true) => {
  if (!pass && gate) ok = false;
  results.push([gate ? (pass ? 'PASS' : 'FAIL') : 'INFO', name, detail]);
  return pass;
};

const plugin = readJSON('.claude-plugin/plugin.json');
const marketplace = readJSON('.claude-plugin/marketplace.json');

// plugin.json is the authority — it is the first thing Claude Code resolves a
// version from, and it silently wins over the marketplace entry.
const version = plugin.version;
const tag = `v${version}`;
console.log(`\nRelease under test: ${tag}  (from .claude-plugin/plugin.json, the version Claude Code resolves first)`);

// --- the version string, everywhere it is written down -----------------------
const entry = marketplace.plugins?.find((p) => p.name === plugin.name);
if (!check('marketplace entry', !!entry, entry ? `"${plugin.name}" found` : `no plugin named "${plugin.name}" in marketplace.json`)) {
  report();
}

check('marketplace version', entry.version === version, `${entry.version ?? '(unset)'} — plugin.json says ${version}`);

const readme = read('README.md').match(/^\*\*Version\s+(\S+)\*\*/m);
check('README header', readme?.[1] === version, readme ? `${readme[1]}` : 'no "**Version X.Y.Z**" header found');

const changelog = read('CHANGELOG.md').match(/^## \[([^\]]+)\]/m);
check('CHANGELOG top entry', changelog?.[1] === version, changelog ? `[${changelog[1]}]` : 'no "## [X.Y.Z]" entry found');

// --- the pin -----------------------------------------------------------------
const source = entry.source;
const pinned = source && typeof source === 'object';
check('source is pinned', pinned,
  pinned ? `${source.source}:${source.repo}` :
    `"${source}" — a string source resolves against the marketplace's own checkout (the default branch), so a version would not identify a tree`);

if (pinned) {
  check('source.ref names the tag', source.ref === tag, `ref "${source.ref ?? '(unset)'}" — expected "${tag}"`);
}

// --- the tag, and what is actually inside it ---------------------------------
const commit = git('rev-list', '-n1', tag);
if (check('tag exists', !!commit, commit ? `${tag} -> ${commit.slice(0, 7)}` : `${tag} not found — the release commit is not tagged yet`)) {
  const type = git('cat-file', '-t', git('rev-parse', tag) ?? '');
  check('tag is annotated', type === 'tag', `${type ?? 'unknown'} — v1.0.0 set the convention: git tag -a ${tag} -m "Arena ${tag}"`, false);

  // The whole reason this script exists.
  const atTag = git('show', `${tag}:.claude-plugin/plugin.json`);
  if (check('plugin.json at the tag', !!atTag, atTag ? '' : `cannot read .claude-plugin/plugin.json at ${tag}`)) {
    let tagged = null;
    try { tagged = JSON.parse(atTag).version; } catch { /* reported below */ }
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
