/* Holds the four documentation norms nothing else checks: every .md under
 * MAX_DOCUMENT_CHARS unless SIZE_ALLOWANCE raises it, no banned punctuation in
 * a document's prose, the comment rule, which lets scripts and tests carry one
 * header of at most HEADER_MAX_LINES and every other hand-written source none,
 * and the branch boundary, which keeps a contributor path out of a consumer's
 * last stop and, through RULE_OWNERS, a rule off the branch that does not own
 * it. SIZE_ALLOWANCE is empty, and that emptiness is the claim: a document that
 * falls back inside the shared limit after being raised fails, so a ceiling
 * cannot quietly become permanent. A generated file is never read here. */

import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';
import { findComments } from '../../lib/arena/comments.ts';
import { proseSegments } from '../../lib/arena/markdown-prose.ts';
import { repoRoot as ROOT } from '../../lib/arena/repo-root.ts';
import { emittedTree } from '../../lib/arena/layers.ts';

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

export const SIZE_ALLOWANCE = new Map<string, { limit: number; reason: string }>([]);

export function limitFor(rel: string) {
  return SIZE_ALLOWANCE.get(rel)?.limit ?? MAX_DOCUMENT_CHARS;
}

export const BANNED_PUNCTUATION = [['—', 'an em dash']];

const SOURCE_EXTENSIONS = ['.mjs', '.jsx', '.tsx', '.ts', '.js'];
export const SCANNED_TREES = ['scripts', 'frameworks', '.github'];
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', 'dist']);

export const READ_DESPITE_THE_DOT = new Set(['.gitkeep', '.github']);

export { emittedTree };

function walk(dir: string, keep, emitted): string[] {
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

function startsFile(source: string, comment) {
  return source.slice(0, source.indexOf(comment.text)).replace(SHEBANG, '').trim() === '';
}

export function isGenerated(path: string) {
  return /\.generated\./.test(path);
}

export function allowsHeader(repoRelativePath) {
  const parts = repoRelativePath.split(sep);
  return parts[0] === 'scripts'
    || parts.includes('test')
    || basename(repoRelativePath).includes('.test.');
}

function isPragma(text: string) {
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

export const CONSUMER_PACKAGE_PAGE = 'PACKAGE.md';

export function isConsumerDocument(repoRelativePath) {
  if (Object.hasOwn(BRANCH_SWITCH, repoRelativePath)) return false;
  if (repoRelativePath.endsWith(CONSUMER_LAST_STOP)) return true;
  if (basename(repoRelativePath) === CONSUMER_PACKAGE_PAGE && repoRelativePath.startsWith(CONSUMER_TREE)) return true;
  return basename(repoRelativePath) === CONSUMER_INDEX && repoRelativePath.startsWith(CONSUMER_TREE);
}

export const CONSUMER_OWN_OUTPUT = new Map([
  ['arena.generated.css',
   'the stylesheet the CONSUMER generates, in their own project, by running the arena-to-prod '
   + 'command each package ships. It carries the .generated. infix and is nothing this repository '
   + 'builds, so the build-product rule below reads it backwards: a reader of the npm page has '
   + 'this file and is being told to make it.'],
  ['icons.generated.css',
   'the Phosphor subset the CONSUMER generates, in their own project, by the same run of '
   + 'arena-to-prod. Same reading as arena.generated.css above: the infix is theirs '
   + 'and not this repository\'s, and the name is the one the npm page tells them to write.'],
]);

export const CONTRIBUTOR_PATHS = [
  [/\bscripts\/[\w./-]+/g, 'a path under scripts/, which no consumer of Arena has'],
  [/\bcontracts\/[a-z-]+\/AGENTS\.md\b/g, 'a normative contract document, which the router says not to read'],
  [/\bframeworks\/[a-z-]+\/AGENTS\.md\b/g, "a layer document, which is about changing Arena rather than using it"],
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

export const CONTRIBUTOR_BRANCH = 'contributor';
export const CONSUMER_BRANCH = 'consumer';

export const RULE_OWNERS = [
  {
    phrase: 'the nine forms',
    owner: CONTRIBUTOR_BRANCH,
    reason:
      "the API contract's own vocabulary. A consumer reads a member's type and default from the "
      + 'prompt table and never has to know how many forms exist, so a prompt reaching for the '
      + 'count is explaining a rule rather than a component.',
  },
  {
    phrase: 'binding table',
    owner: CONTRIBUTOR_BRANCH,
    reason:
      "the mapping from a contract member to each layer's idiom, which the layer has already "
      + 'applied by the time a consumer reads the prompt. Naming it sends a reader to a document '
      + 'the router tells them not to open.',
  },
  {
    phrase: /\bR[1-6]\b/,
    owner: CONTRIBUTOR_BRANCH,
    reason:
      'one of the six derived rules, cited by number. A rule number is a pointer into a rulebook '
      + 'the consumer branch never hands anybody, and it reaches a published .d.ts whenever it is '
      + "written into a contract description. State the consequence instead: \"a platform's own "
      + 'event type never travels in a payload\" says the same thing to a reader who has no R4. '
      + 'Registered as the family rather than as one number, because the first version of this '
      + 'entry named R4 alone and twenty-two live instances of R6 sat behind it.',
  },
  {
    phrase: /\bcheck:[a-z-]+/,
    owner: CONTRIBUTOR_BRANCH,
    reason:
      'a gate. Nobody consuming a package has the repository that runs one, so citing it as the '
      + 'reason for an API decision explains nothing and names a thing the reader cannot look at.',
  },
];

export function statesRule(text: string, phrase) {
  return typeof phrase === 'string' ? text.includes(phrase) : phrase.test(text);
}

export function ruleOwnerProblems(root = ROOT, owners = RULE_OWNERS) {
  const problems = [];
  const met = new Set();
  for (const path of documents(root)) {
    const rel = relative(root, path);
    const branch = isConsumerDocument(rel) ? CONSUMER_BRANCH : CONTRIBUTOR_BRANCH;
    const text = readFileSync(path, 'utf8');
    for (const { phrase, owner, reason } of owners) {
      if (!statesRule(text, phrase)) continue;
      if (branch === owner) { met.add(phrase); continue; }
      problems.push(
        `${rel}: states "${phrase}", a ${owner} rule, on the ${branch} branch. `
        + `A rule written into both branches goes stale in one of them: ${reason}`,
      );
    }
  }
  for (const { phrase, owner, reason } of owners) {
    if (met.has(phrase)) continue;
    problems.push(
      `RULE_OWNERS assigns "${phrase}" to the ${owner} branch, and no document there states it, `
      + `so the entry outlived the rule it was written for: ${reason}`,
    );
  }
  return problems;
}

export const MEMBER_DOC_TREE = /^frameworks\/[^/]+\/components\//;

function isMemberDoc(text: string, repoRelativePath) {
  return MEMBER_DOC_TREE.test(repoRelativePath)
    && !repoRelativePath.includes('.test.')
    && text.startsWith('/**');
}

function documents(root) {
  return walk(root, (p) => p.endsWith('.md'), emittedTree(root));
}

function exempt(list, rel: string) {
  return list.some((e) => rel === e || rel.startsWith(e));
}

function quote(text: string) {
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
        if ([...CONSUMER_OWN_OUTPUT.keys()].some((name) => name.startsWith(hit))) continue;
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
    ...comments.problems, ...branch.problems, ...ruleOwnerProblems(),
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
    + `${branch.scanned} consumer document(s) cite no contributor path, and neither branch `
    + `states one of the other's ${RULE_OWNERS.length} registered rules`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
