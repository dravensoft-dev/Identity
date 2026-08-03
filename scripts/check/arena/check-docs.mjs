/* Holds the four documentation norms nothing else checks: every .md under
 * MAX_DOCUMENT_CHARS, no banned punctuation in a document's prose, the
 * comment rule, which lets scripts and tests carry one header of at most
 * HEADER_MAX_LINES and every other hand-written source none, and the branch
 * boundary, which keeps a contributor path out of a consumer's last stop.
 * A file a script generates is outside the comment rule and is never read. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';
import { findComments } from '../../lib/arena/comments.mjs';
import { proseSegments } from '../../lib/arena/markdown-prose.mjs';
import { repoRoot as ROOT } from '../../lib/arena/repo-root.mjs';
import { emittedTree } from '../../lib/arena/layers.mjs';

export const MAX_DOCUMENT_CHARS = 60_000;
export const HEADER_MAX_LINES = 10;
export const QUOTED_RUN_CHARS = 90;

export const EXPLANATORY_BY_CHARTER = 'DOUBTS.md';
export const DATED_PROCESS_DOCUMENTS = join('docs', '');
export const SIZE_EXEMPT = [
  EXPLANATORY_BY_CHARTER,
  DATED_PROCESS_DOCUMENTS,
];

export const PROSE_EXEMPT = {
  [DATED_PROCESS_DOCUMENTS]:
    'a spec or a plan is deleted once executed, so its prose never becomes documentation',
};

export const CONTRIBUTOR_ROOT = 'CLAUDE.md';

export const SIZE_ALLOWANCE = new Map([
  [CONTRIBUTOR_ROOT, {
    limit: 65_000,
    reason:
      'the root of the contributor branch carries the rules that bind more than one layer, and it '
      + 'is the one document with nowhere above it to push a rule to. At the shared limit it had '
      + 'run to a margin measured in tens of characters, so a true fact could only be added by '
      + 'removing another, which is a worse failure than a long document. An allowance rather than '
      + 'an exemption, because the pressure to decompose it should return rather than end.',
  }],
]);

export function limitFor(rel) {
  return SIZE_ALLOWANCE.get(rel)?.limit ?? MAX_DOCUMENT_CHARS;
}

export const BANNED_PUNCTUATION = [['—', 'an em dash']];

const SOURCE_EXTENSIONS = ['.mjs', '.jsx', '.tsx', '.ts', '.js'];
export const SCANNED_TREES = ['scripts', 'frameworks', '.github'];
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', 'dist']);

export const READ_DESPITE_THE_DOT = new Set(['.gitkeep', '.github']);

export { emittedTree };

function walk(dir, keep, emitted) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && !READ_DESPITE_THE_DOT.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || full === emitted) continue;
      found.push(...walk(full, keep, emitted));
    } else if (keep(full)) {
      found.push(full);
    }
  }
  return found;
}

export const SHEBANG = /^#![^\n]*\n/;

function startsFile(source, comment) {
  return source.slice(0, source.indexOf(comment.text)).replace(SHEBANG, '').trim() === '';
}

export function isGenerated(path) {
  return /\.generated\./.test(path);
}

export function allowsHeader(repoRelativePath) {
  const parts = repoRelativePath.split(sep);
  return parts[0] === 'scripts'
    || parts.includes('test')
    || basename(repoRelativePath).includes('.test.');
}

function isPragma(text) {
  return /^\/[/*]\s*(@ts-|eslint-|prettier-|c8 |istanbul )/.test(text);
}

export const CONSUMER_LAST_STOP = '.prompt.md';
export const CONSUMER_INDEX = 'SKILL.md';
export const CONSUMER_TREE = `frameworks${sep}`;

export const BRANCH_SWITCH = {
  'SKILL.md':
    'the root router is the switch between the two branches, and naming the contributor one is '
    + 'how it sends a contributor away. Every consumer document below it is downstream of that '
    + 'choice and has nobody left to redirect.',
};

export function isConsumerDocument(repoRelativePath) {
  if (Object.hasOwn(BRANCH_SWITCH, repoRelativePath)) return false;
  if (repoRelativePath.endsWith(CONSUMER_LAST_STOP)) return true;
  return basename(repoRelativePath) === CONSUMER_INDEX && repoRelativePath.startsWith(CONSUMER_TREE);
}

export const CONTRIBUTOR_PATHS = [
  [/\bscripts\/[\w./-]+/g, 'a path under scripts/, which no consumer of Arena has'],
  [/\bcontracts\/[a-z-]+\/README\.md\b/g, 'a normative contract README, which the router says not to read'],
  [/\bframeworks\/[a-z-]+\/README\.md\b/g, "a layer README, which is about changing Arena rather than using it"],
  [/\bframeworks\/PACKAGING\.md\b/g, 'the packaging document, which is about publishing Arena rather than using it'],
  [/\bframeworks\/[a-z-]+\/[A-Z][\w.]*\.[jt]sx?\b/g,
    'a layer-root source file, which a consumer reaches by importing the package rather than by path'],
  [/\b[\w-]+(?:\.[\w-]+)*\.(?:test|spec)\.(?:[jt]sx?)?/g,
    'a test file, which ships in no package and asserts something only this repository can run'],
  [/\b[\w-]+\.variants\.ts\b/g,
    "a layer's own styling recipe, which is compiled away before a package ships"],
  [/\b[\w-]+\.manifest\.json\b/g,
    'a Tailwind manifest, which is a source of the compiled stylesheet rather than a file a consumer has'],
  [/\b[\w-]+\.generated\b(?!\.html)/g,
    'a build product, which a consumer reaches by importing the package rather than by name. '
    + 'A generated demo page is the exception, being the one a by-hand check opens'],
];

export const MEMBER_DOC_TREE = /^frameworks\/[^/]+\/components\//;

function isMemberDoc(text, repoRelativePath) {
  return MEMBER_DOC_TREE.test(repoRelativePath)
    && !repoRelativePath.includes('.test.')
    && text.startsWith('/**');
}

function documents(root) {
  return walk(root, (p) => p.endsWith('.md'), emittedTree(root));
}

function exempt(list, rel) {
  return list.some((e) => rel === e || rel.startsWith(e));
}

function quote(text) {
  const run = text.trim();
  return run.length > QUOTED_RUN_CHARS ? `${run.slice(0, QUOTED_RUN_CHARS)}...` : run;
}

export function punctuationProblems(root = ROOT) {
  const scanned = documents(root);
  const problems = [];
  for (const path of scanned) {
    const rel = relative(root, path);
    if (exempt(Object.keys(PROSE_EXEMPT), rel)) continue;
    for (const segment of proseSegments(readFileSync(path, 'utf8'))) {
      for (const [character, name] of BANNED_PUNCTUATION) {
        let at = segment.text.indexOf(character);
        while (at !== -1) {
          problems.push(
            `${rel}:${segment.line}:${segment.column + at}: ${name} in prose; `
            + `documentation punctuates with a colon, a comma or a full stop: "${quote(segment.text)}"`,
          );
          at = segment.text.indexOf(character, at + character.length);
        }
      }
    }
  }
  return { problems, scanned: scanned.length };
}

export function documentSizeProblems(root = ROOT, allowance = SIZE_ALLOWANCE) {
  const scanned = documents(root);
  const problems = [];
  const sizes = new Map();
  for (const path of scanned) {
    const rel = relative(root, path);
    if (exempt(SIZE_EXEMPT, rel)) continue;
    const size = readFileSync(path, 'utf8').length;
    sizes.set(rel, size);
    const limit = allowance.get(rel)?.limit ?? MAX_DOCUMENT_CHARS;
    if (size > limit) {
      problems.push(`${rel}: ${size} characters, over the ${limit} limit`);
    }
  }
  problems.push(...staleAllowanceProblems(sizes, allowance));
  return { problems, scanned: scanned.length };
}

export function staleAllowanceProblems(sizes, allowance = SIZE_ALLOWANCE) {
  const problems = [];
  for (const [rel, { limit, reason }] of allowance) {
    if (!sizes.has(rel)) {
      problems.push(
        `SIZE_ALLOWANCE raises ${rel} to ${limit}, and no document is there. An allowance for a `
        + `file that has moved or gone raises the limit for nothing: ${reason}`,
      );
      continue;
    }
    if (sizes.get(rel) <= MAX_DOCUMENT_CHARS) {
      problems.push(
        `SIZE_ALLOWANCE raises ${rel} to ${limit}, and it is ${sizes.get(rel)} characters, inside `
        + `the ${MAX_DOCUMENT_CHARS} everything else holds to. The allowance has outlived what it `
        + `was written for, so delete it and let the shared limit apply: ${reason}`,
      );
    }
  }
  return problems;
}

export function commentRuleProblems(root = ROOT) {
  const sources = SCANNED_TREES
    .map((tree) => join(root, tree))
    .filter((dir) => existsSync(dir))
    .flatMap((dir) => walk(dir, (p) => SOURCE_EXTENSIONS.some((e) => p.endsWith(e)), emittedTree(root)));

  const problems = [];
  let scanned = 0;

  for (const path of sources) {
    const source = readFileSync(path, 'utf8');
    if (isGenerated(path)) continue;
    scanned += 1;

    const rel = relative(root, path);
    const comments = findComments(source)
      .filter((c) => !isPragma(c.text) && !isMemberDoc(c.text, rel));
    if (comments.length === 0) continue;

    const [first, ...rest] = comments;
    const headerAllowed = allowsHeader(rel);

    if (!headerAllowed) {
      problems.push(`${rel}:${first.line}: carries a comment; only scripts and tests may, and only as a header`);
      continue;
    }
    if (!startsFile(source, first)) {
      problems.push(`${rel}:${first.line}: the one allowed comment must be the file header`);
      continue;
    }
    if (first.lines > HEADER_MAX_LINES) {
      problems.push(`${rel}:${first.line}: header is ${first.lines} lines, over the ${HEADER_MAX_LINES} limit`);
    }
    for (const extra of rest) {
      problems.push(`${rel}:${extra.line}: a second comment; one header per file is the whole allowance`);
    }
  }

  return { problems, scanned };
}

export function consumerBranchProblems(root = ROOT) {
  const scanned = documents(root).filter((p) => isConsumerDocument(relative(root, p)));
  const problems = [];
  for (const path of scanned) {
    const rel = relative(root, path);
    const source = readFileSync(path, 'utf8');
    for (const [pattern, reason] of CONTRIBUTOR_PATHS) {
      for (const hit of source.match(pattern) ?? []) {
        problems.push(
          `${rel}: cites "${hit}", ${reason}. A consumer document is a stop on the way to writing `
          + 'a component: state the consequence here, and leave the reason on the contributor branch',
        );
      }
    }
  }
  return { problems, scanned: scanned.length };
}

export function zeroScanProblems({ documents, sources, prompts }) {
  const problems = [];
  if (documents === 0) problems.push('found no .md files at all -- the document walk reached nothing');
  if (sources === 0) problems.push('found no source files at all -- the comment walk reached nothing');
  if (prompts === 0) problems.push('found no .prompt.md files at all -- the consumer branch reached nothing');
  return problems;
}

export function branchSwitchProblems(root = ROOT) {
  return Object.keys(BRANCH_SWITCH)
    .filter((rel) => !existsSync(join(root, rel)))
    .map((rel) => `BRANCH_SWITCH exempts ${rel}, which is not there -- a stale exemption is worse than none`);
}

function main() {
  const sizes = documentSizeProblems();
  const punctuation = punctuationProblems();
  const comments = commentRuleProblems();
  const branch = consumerBranchProblems();
  const empty = zeroScanProblems({
    documents: sizes.scanned,
    sources: comments.scanned,
    prompts: branch.scanned,
  });
  const problems = [
    ...empty, ...branchSwitchProblems(), ...sizes.problems, ...punctuation.problems,
    ...comments.problems, ...branch.problems,
  ];

  if (problems.length > 0) {
    for (const problem of problems) console.error(`check-docs: ${problem}`);
    console.error(`\ncheck-docs: ${problems.length} problem(s)`);
    process.exit(1);
  }
  console.log(
    `check-docs: ${sizes.scanned} document(s) inside their limit, ${MAX_DOCUMENT_CHARS} characters `
    + `bar ${SIZE_ALLOWANCE.size} on the record, and clear of `
    + `banned punctuation; ${comments.scanned} hand-written source(s) hold to the comment rule; `
    + `${branch.scanned} consumer document(s) cite no contributor path`,
  );
}

if (process.argv[1] && process.argv[1].endsWith('check-docs.mjs')) main();
