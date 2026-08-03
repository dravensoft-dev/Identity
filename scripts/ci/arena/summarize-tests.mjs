/* Runs the test suite the way check-all runs it and reports the result per domain.
 * The invocation is taken from testStep(), never rebuilt: this appends the two junit
 * flags to the steps that are already there and changes nothing else, so check-all
 * stays the single authority and a narrowed run cannot enter through here. A domain
 * that owns suites and reports no case is a failure, because a reporter that dropped
 * them would otherwise print a confident table of zeros. */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, appendFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { testStep } from '../../check/arena/check-all.mjs';
import { DOMAINS, domainOfTestPath } from '../../lib/arena/domains.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

export const REPORT_DIR = join('.cache', 'junit');

export const EXPECTED_ROOTS = [
  'scripts/',
  'frameworks/react/',
  'frameworks/angular/build/test/',
];

export function stepsWithJunit(dir = REPORT_DIR) {
  let n = 0;
  return testStep({ isBun: true, testFiles: [] }).map((step) => {
    if (step.args[0] !== 'test') return step;
    n += 1;
    const outfile = `${dir}/suite-${n}.xml`;
    return { ...step, args: [...step.args, '--reporter=junit', `--reporter-outfile=${outfile}`], outfile };
  });
}

function attribute(chunk, name) {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(chunk);
  return m ? m[1] : null;
}

export function parseJunit(xml) {
  const cases = [];
  for (const suite of String(xml).split('<testsuite ').slice(1)) {
    const suiteFile = attribute(suite.slice(0, suite.indexOf('>')), 'file');
    for (const raw of suite.split('<testcase ').slice(1)) {
      const selfClosing = /^[^>]*\/>/.test(raw);
      const chunk = selfClosing ? raw.slice(0, raw.indexOf('>')) : raw.slice(0, raw.indexOf('</testcase>'));
      const status = /<failure\b/.test(chunk) ? 'fail' : /<skipped\b/.test(chunk) ? 'skip' : 'pass';
      cases.push({ file: attribute(chunk.slice(0, chunk.indexOf('>') + 1), 'file') ?? suiteFile, status });
    }
  }
  return cases;
}

export function tally(cases) {
  const byDomain = new Map(DOMAINS.map((d) => [d, { pass: 0, fail: 0, skip: 0 }]));
  const unclassified = [];
  for (const c of cases) {
    const domain = domainOfTestPath(c.file ?? '');
    if (!domain) { unclassified.push(c.file); continue; }
    byDomain.get(domain)[c.status] += 1;
  }
  return { byDomain, unclassified, total: cases.length, files: cases.map((c) => c.file) };
}

export function suiteDomains(dir) {
  const found = new Set();
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.test\.mjs$/.test(entry.name)) continue;
      const domain = domainOfTestPath(relative(repoRoot, full));
      if (domain) found.add(domain);
    }
  };
  if (existsSync(dir)) walk(dir);
  return [...found].sort();
}

export function coverageProblems(counted, expectedDomains, roots = EXPECTED_ROOTS) {
  const problems = [];
  for (const domain of expectedDomains) {
    const row = counted.byDomain.get(domain);
    const seen = row ? row.pass + row.fail + row.skip : 0;
    if (seen === 0) {
      problems.push(`domain ${domain} owns suites and reported 0 cases, so the reporter dropped them`);
    }
  }
  for (const root of roots) {
    if (!counted.files.some((f) => String(f).includes(root))) {
      problems.push(`no case came from ${root}, so that tree was never opened by this run`);
    }
  }
  return problems;
}

export function renderSummary(counted) {
  const rows = DOMAINS.map((domain) => {
    const { pass, fail, skip } = counted.byDomain.get(domain);
    return `| ${domain} | ${pass} | ${fail} | ${skip} |`;
  });
  const totals = DOMAINS.reduce((acc, d) => {
    const r = counted.byDomain.get(d);
    return { pass: acc.pass + r.pass, fail: acc.fail + r.fail, skip: acc.skip + r.skip };
  }, { pass: 0, fail: 0, skip: 0 });

  return [
    '### Arena test suite',
    '',
    '| domain | passed | failed | skipped |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
    `| **total** | **${totals.pass}** | **${totals.fail}** | **${totals.skip}** |`,
    '',
  ].join('\n');
}

function main() {
  mkdirSync(join(repoRoot, REPORT_DIR), { recursive: true });

  let failed = 0;
  const cases = [];
  for (const step of stepsWithJunit()) {
    console.log(`\n> ${step.name}\n`);
    const r = spawnSync(process.execPath, step.args, { stdio: 'inherit', cwd: repoRoot });
    if (r.error || r.status !== 0) failed += 1;
    if (!step.outfile) continue;
    const path = join(repoRoot, step.outfile);
    if (!existsSync(path)) {
      console.error(`summarize-tests: ${step.outfile} was never written, so this step reported nothing`);
      failed += 1;
      continue;
    }
    cases.push(...parseJunit(readFileSync(path, 'utf8')));
  }

  const counted = tally(cases);
  const summary = renderSummary(counted);
  const sink = process.env['GITHUB_STEP_SUMMARY'];
  if (sink) appendFileSync(sink, `${summary}\n`);
  console.log(`\n${summary}`);

  const problems = [];
  if (counted.total === 0) problems.push('the run reported 0 cases, and an empty result set is a failure rather than a clean pass');
  for (const file of counted.unclassified) problems.push(`${file}: belongs to no domain, so its cases are counted nowhere`);
  problems.push(...coverageProblems(counted, suiteDomains(join(repoRoot, 'scripts'))));

  if (problems.length > 0) {
    console.error(`\nsummarize-tests: ${problems.length} problem(s) with the report itself\n`);
    for (const p of problems) console.error(`  ${p}`);
  }
  process.exit(failed > 0 || problems.length > 0 ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
