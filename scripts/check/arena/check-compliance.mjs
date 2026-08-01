/* The coverage record for the behaviour render suites. COVERED is keyed
 * <component>:<layer>, and the layer is decided structurally from the SUITE_DIRS
 * tree a suite was found under, never from its text. No pattern is excluded: `grid`
 * components were, on a memory measurement that no longer holds. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';
import {
  reactComponents, reactBindingPath, angularPrimitives, angularBindingPath, loadBinding, bindingCases,
} from '../../lib/arena/behaviour-contracts.mjs';
import { kebab } from '../../lib/arena/layers.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

export const SUITE_DIRS = [
  { layer: 'react', dir: join(repoRoot, 'frameworks', 'react', 'components') },
  { layer: 'react', dir: join(repoRoot, 'frameworks', 'react', 'test') },
  { layer: 'angular', dir: join(repoRoot, 'frameworks', 'angular', 'components') },
  { layer: 'angular', dir: join(repoRoot, 'frameworks', 'angular', 'test') },
];

export const COVERED = {
  'Dialog:react': 'DialogModal.dom.test.tsx',
  'ConfirmDialog:react': 'DialogModal.dom.test.tsx',
  'Onboarding:react': 'Onboarding.dom.test.tsx',
  'Menu:react': 'Menu.dom.test.tsx',
  'BulkActionBar:react': 'BulkActionBar.toolbar.dom.test.tsx',
  'CommandPalette:react': 'CommandPalette.combobox.dom.test.tsx',
  'Skeleton:react': 'PlacementAndBranches.dom.test.tsx',
  'SideNavCollapsible:react': 'SideNav.disclosure.dom.test.tsx',
  'Tabs:react': 'Tabs.dom.test.tsx',
  'Tooltip:react': 'Tooltip.keyboard.dom.test.tsx',
  'Alert:react': 'AlertTones.dom.test.tsx',
  'Toast:react': 'AlertTones.dom.test.tsx',
  'ProgressBar:react': 'ProgressBar.dom.test.tsx',
  'Spinner:react': 'Spinner.dom.test.tsx',
  'Tag:react': 'TagAndChipCases.dom.test.tsx',
  'CalendarEvent:react': 'TagAndChipCases.dom.test.tsx',
  'ActivityFeed:react': 'ActivityFeed.cases.dom.test.tsx',
  'BarChart:react': 'ChartFigures.dom.test.tsx',
  'DoughnutChart:react': 'ChartFigures.dom.test.tsx',
  'LineChart:react': 'ChartFigures.dom.test.tsx',
  'Button:react': 'FormControlPatterns.dom.test.tsx',
  'IconButton:react': 'FormControlPatterns.dom.test.tsx',
  'Checkbox:react': 'FormControlPatterns.dom.test.tsx',
  'Select:react': 'FormControlPatterns.dom.test.tsx',
  'Switch:react': 'FormControlPatterns.dom.test.tsx',
  'SegmentedControl:react': 'SegmentedControl.radiogroup.dom.test.tsx',
  'SideNav:react': 'NavigationLandmarks.dom.test.tsx',
  'ErrorState:react': 'AlertTones.dom.test.tsx',
  'Calendar:react': 'Calendar.gridKeyboard.dom.test.tsx',
  'Table:react': 'Table.cases.dom.test.tsx',
  'TableRow:react': 'TableRow.cases.dom.test.tsx',
  'Input:react': 'TextboxStates.dom.test.tsx',
  'Textarea:react': 'TextboxStates.dom.test.tsx',
  'RadioGroup:react': 'RadioGroupPattern.dom.test.tsx',
  'Radio:react': 'RadioGroupPattern.dom.test.tsx',
  'Breadcrumbs:react': 'NavigationLandmarks.dom.test.tsx',
  'AppLogo:react': 'InertComponents.dom.test.tsx',
  'Avatar:react': 'InertComponents.dom.test.tsx',
  'Badge:react': 'InertComponents.dom.test.tsx',
  'Card:react': 'Card.cases.dom.test.tsx',
  'StatCard:react': 'InertComponents.dom.test.tsx',
  'UnauthCard:react': 'InertComponents.dom.test.tsx',
  'ChartCard:react': 'InertComponents.dom.test.tsx',
  'EmptyState:react': 'InertComponents.dom.test.tsx',
  'PageHead:react': 'InertComponents.dom.test.tsx',
  'SideNavSection:react': 'InertComponents.dom.test.tsx',
  'SideNavItem:react': 'SideNavItem.cases.dom.test.tsx',
  'Tab:react': 'Tabs.dom.test.tsx',
  'TableCell:react': 'Table.cases.dom.test.tsx',
  'Pagination:react': 'NavigationLandmarks.dom.test.tsx',
  'Alert:angular': 'Alert.roleTones.test.ts',
  'Badge:angular': 'Badge.compliance.test.ts',
  'Card:angular': 'Card.compliance.test.ts',
  'Table:angular': 'Table.cases.test.ts',
  'TableRow:angular': 'TableRow.cases.test.ts',
  'Calendar:angular': 'Calendar.grid.test.ts',
  'CalendarEvent:angular': 'CalendarEvent.cases.test.ts',
  'TableCell:angular': 'Table.cases.test.ts',
  'BarChart:angular': 'ChartDataTable.test.ts',
  'ActivityFeed:angular': 'ActivityFeed.cases.test.ts',
  'DoughnutChart:angular': 'ChartDataTable.test.ts',
  'LineChart:angular': 'ChartDataTable.test.ts',
  'Skeleton:angular': 'AngularPatternCoverage.test.ts',
  'ErrorState:angular': 'AngularPatternCoverage.test.ts',
  'Onboarding:angular': 'AngularPatternCoverage.test.ts',
  'Breadcrumbs:angular': 'Breadcrumbs.compliance.test.ts',
  'BulkActionBar:angular': 'BulkActionBar.toolbar.test.ts',
  'CommandPalette:angular': 'CommandPalette.combobox.test.ts',
  'Button:angular': 'Button.compliance.test.ts',
  'ConfirmDialog:angular': 'ConfirmDialog.compliance.test.ts',
  'Dialog:angular': 'Dialog.compliance.test.ts',
  'Select:angular': 'Select.compliance.test.ts',
  'Toast:angular': 'Toast.compliance.test.ts',
  'Menu:angular': 'Menu.compliance.test.ts',
  'Tag:angular': 'Tag.cases.test.ts',
  'Tooltip:angular': 'Tooltip.compliance.test.ts',
  'IconButton:angular': 'IconButton.compliance.test.ts',
  'Checkbox:angular': 'Checkbox.compliance.test.ts',
  'Switch:angular': 'Switch.compliance.test.ts',
  'Input:angular': 'Input.compliance.test.ts',
  'Textarea:angular': 'Textarea.compliance.test.ts',
  'RadioGroup:angular': 'RadioGroup.compliance.test.ts',
  'Radio:angular': 'RadioGroup.compliance.test.ts',
  'SegmentedControl:angular': 'SegmentedControl.compliance.test.ts',
  'Tabs:angular': 'Tabs.compliance.test.ts',
  'Tab:angular': 'Tabs.compliance.test.ts',
  'Pagination:angular': 'Pagination.compliance.test.ts',
  'ProgressBar:angular': 'ProgressBar.compliance.test.ts',
  'Spinner:angular': 'Spinner.compliance.test.ts',
  'AppLogo:angular': 'InertComponents.test.ts',
  'Avatar:angular': 'InertComponents.test.ts',
  'StatCard:angular': 'InertComponents.test.ts',
  'UnauthCard:angular': 'InertComponents.test.ts',
  'ChartCard:angular': 'InertComponents.test.ts',
  'EmptyState:angular': 'InertComponents.test.ts',
  'PageHead:angular': 'InertComponents.test.ts',
  'SideNavSection:angular': 'InertComponents.test.ts',
  'SideNavItem:angular': 'SideNavItem.cases.test.ts',
  'SideNav:angular': 'SideNav.compliance.test.ts',
  'SideNavCollapsible:angular': 'SideNavNesting.test.ts',
};

export function suiteMentions(source, tail) {
  const escaped = tail.split('/').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join(`(?:/|['"]\\s*,\\s*['"])`)).test(source);
}

export function validateCoverage({ bindings, covered, suites }) {
  const problems = [];

  const byKey = new Map();
  for (const b of bindings) {
    if (!b.tail) {
      throw new Error(
        `validateCoverage: binding "${b.name}:${b.layer}" carries no tail. A missing tail ` +
        `cannot discriminate by layer -- falling back to a bare "${b.name}.behaviour.json" ` +
        `is the exact pre-fix defect this file exists to prevent. Attach a tail rather than ` +
        `relying on a default.`,
      );
    }
    byKey.set(`${b.name}:${b.layer}`, b.tail);
  }

  for (const [key, suiteFile] of Object.entries(covered)) {
    const sep = key.lastIndexOf(':');
    if (sep === -1) {
      problems.push(
        `COVERED key "${key}" has no ":layer" suffix. Every key must be shaped "<component>:<layer>".`,
      );
      continue;
    }
    const name = key.slice(0, sep);
    const layer = key.slice(sep + 1);

    if (!byKey.has(key)) {
      problems.push(
        `COVERED names "${key}", for which there is no binding named "${name}" in the ${layer} layer. Delete the entry.`,
      );
      continue;
    }
    if (!(suiteFile in suites)) {
      problems.push(`COVERED maps "${key}" to "${suiteFile}", which does not exist. Fix the path or delete the entry.`);
      continue;
    }
    const suite = suites[suiteFile];
    if (suite.layer !== layer) {
      problems.push(
        `COVERED maps "${key}" to "${suiteFile}", which is a suite of the ${suite.layer} layer. ` +
        `A claim for the ${layer} layer needs a ${layer} suite: the two layers can spell byte-identical ` +
        `binding paths, so naming the right file is not evidence of the right layer.`,
      );
      continue;
    }
    const tail = byKey.get(key);
    if (!suiteMentions(suite.source, tail)) {
      problems.push(
        `COVERED maps "${key}" to "${suiteFile}", but that suite never names ${tail}. The coverage claim is stale.`,
      );
    }
  }
  return problems;
}

export function inventoryFrom(bindings) {
  const out = [];
  for (const [key, binding] of Object.entries(bindings)) {
    const sep = key.lastIndexOf(':');
    const name = sep === -1 ? key : key.slice(0, sep);
    const layer = sep === -1 ? '' : key.slice(sep + 1);
    if (!binding.tail) {
      throw new Error(
        `inventoryFrom: binding "${key}" carries no tail. A missing tail cannot ` +
        `discriminate by layer -- falling back to a bare "${name}.behaviour.json" is the ` +
        `exact pre-fix defect this file exists to prevent. Attach a tail rather than ` +
        `relying on a default.`,
      );
    }
    out.push({
      name,
      layer,
      tail: binding.tail,
      patterns: bindingCases(binding).map((c) => c.pattern),
    });
  }
  return out;
}

function collectBindings() {

  const byKey = {};

  for (const name of reactComponents(repoRoot)) {
    const found = reactBindingPath(repoRoot, kebab(name));
    if (!found) continue;
    const binding = loadBinding(found.path);
    byKey[`${name}:react`] = { ...binding, tail: found.tail };
  }

  for (const dir of angularPrimitives(repoRoot)) {
    const found = angularBindingPath(repoRoot, dir);
    if (!found) continue;
    const binding = loadBinding(found.path);
    byKey[`${binding.component}:angular`] = { ...binding, tail: found.tail };
  }

  return inventoryFrom(byKey);
}

export function walkSuites(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSuites(path));
    } else if (/\.test\.(jsx|tsx|ts|mjs)$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

export function collectSuites(dirs = SUITE_DIRS) {
  const out = {};
  const seen = new Map();
  for (const { layer, dir } of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of walkSuites(dir)) {
      const name = basename(f);
      if (seen.has(name))
        throw new Error(
          `check:compliance — two suites share the basename ${name}:\n  ${seen.get(name)}\n  ${f}\n` +
          `Suites are keyed by basename, so one would silently shadow the other.`);
      seen.set(name, f);
      out[name] = { source: readFileSync(f, 'utf8'), layer };
    }
  }
  return out;
}

function main() {
  const bindings = collectBindings();
  const suites = collectSuites();
  const problems = validateCoverage({ bindings, covered: COVERED, suites });

  if (problems.length) {
    console.error('check:compliance — the coverage record no longer matches the tree:\n');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
  }
  const total = bindings.length;
  const n = Object.keys(COVERED).length;
  console.log(`check:compliance OK — ${n} of ${total} bindings verified by a render suite; every coverage claim is current.`);
  console.log('  (A green run says the declarations are honest, never that the components are accessible.)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
