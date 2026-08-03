/* Which manifest draws which component's surface, and which components draw their own.
 * It is a fact about the Tailwind layer rather than about any one check, and it lives here
 * because two gates read it: check-manifest-states asks whose affordances a manifest may
 * carry, and check-appearance asks which manifest a component has to render. Either gate
 * owning it would make the other import in a cycle. A manifest mirrors a SURFACE, so a
 * compound family draws several contracted components from one, and a component that
 * composes another types that one's slot out by hand. HAND_DRAWN is the complement: a
 * component with no surface a class string can describe, which writes its own appearance. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kebab } from '../arena/layers.mjs';
import { repoRoot } from '../arena/repo-root.mjs';

export const MANIFEST_COVERS = new Map([
  ['Table', {
    covers: ['Table', 'TableRow', 'TableCell'],
    reason: 'One manifest draws the whole grid: the header and the empty state are Table\'s, the '
      + 'interactive row is TableRow\'s and the cells are TableCell\'s.',
  }],
  ['Tabs', {
    covers: ['Tabs', 'Tab'],
    reason: 'The tablist and its tab buttons are Tabs\'; the panel is Tab\'s. The roving stop that '
      + 'carries the focus ring sits on a tab, which is the member Tab contracts.',
  }],
  ['BottomNav', {
    covers: ['BottomNav', 'BottomNavItem'],
    reason: 'One manifest draws the whole bar -- the fixed row is BottomNav\'s and the equal '
      + 'column, its glyph, its label and its badge are BottomNavItem\'s. The item carries no '
      + 'manifest of its own because it has no surface of its own: it IS a column of the bar.',
  }],
  ['SideNav', {
    covers: ['SideNav', 'SideNavItem', 'SideNavSection', 'SideNavCollapsible'],
    reason: 'The family nests to any depth and one manifest holds every level of it -- the rail, a '
      + 'destination row, a labelled group and a disclosure.',
  }],
  ['Calendar', {
    covers: ['Calendar', 'CalendarEvent'],
    reason: 'The grid and its chips are one surface: a chip is positioned as a share of the grid, '
      + 'so its slots cannot live in a manifest of their own.',
  }],
  ['Radio', {
    covers: ['Radio', 'RadioGroup'],
    reason: 'One manifest draws the whole group -- the fieldset and the legend naming it are '
      + 'RadioGroup\'s and every control in it is Radio\'s. The group carries no manifest of its '
      + 'own because it has no surface of its own: it IS the frame around a set of radios.',
  }],
  ['ConfirmDialog', {
    covers: ['ConfirmDialog', 'Button'],
    reason: 'The dialog draws the confirm action itself, because that action carries Arena\'s one '
      + 'filled danger surface and a Button forwards no style. The cancel action is still an Arena '
      + 'Button, and a manifest has no composition, so it types that button out as its own slot and '
      + 'needs Button\'s affordance.',
  }],
  ['ErrorState', {
    covers: ['ErrorState', 'Button'],
    reason: 'The retry action is an Arena Button, typed out as a slot for the same reason '
      + 'ConfirmDialog\'s is.',
  }],
]);

export const HAND_DRAWN = new Map([
  ['BarChart', 'draws geometry rather than a surface: bar rectangles positioned from the data\'s '
    + 'own range against a measured inner height. A class string cannot describe a shape whose '
    + 'coordinates ARE the data, so it carries no manifest, writes its own appearance, and is '
    + 'what the react half of check-manifest-states reads.'],
  ['DoughnutChart', 'the same, for arc paths swept from each slice\'s share of the total, and for '
    + 'a legend laid out against the ring it annotates.'],
  ['LineChart', 'the same, for a polyline whose points are the series projected onto the measured '
    + 'plot area.'],
]);

const COMPONENTS_JSON = join(repoRoot, 'frameworks/Components.json');
const MANIFEST_DIR = join(repoRoot, 'frameworks/tailwind/components');

export function categories(root = repoRoot) {
  const path = root === repoRoot ? COMPONENTS_JSON : join(root, 'frameworks/Components.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function categoryOf(name, root = repoRoot) {
  for (const [category, names] of Object.entries(categories(root)))
    if (names.includes(name)) return category;
  return null;
}

export function everyComponent(root = repoRoot) {
  return Object.values(categories(root)).flat().sort();
}

export function inScope(root = repoRoot) {
  return everyComponent(root).filter((name) => !HAND_DRAWN.has(name));
}

export function hasOwnManifest(name, root = repoRoot) {
  const category = categoryOf(name, root);
  if (!category) return false;
  const dir = root === repoRoot ? MANIFEST_DIR : join(root, 'frameworks/tailwind/components');
  return existsSync(join(dir, category, kebab(name), `${name}.manifest.json`));
}

export function coveringManifest(name) {
  for (const [manifest, { covers }] of MANIFEST_COVERS)
    if (manifest !== name && covers.includes(name)) return manifest;
  return null;
}

export function manifestFor(name, root = repoRoot) {
  if (hasOwnManifest(name, root)) return name;
  return coveringManifest(name);
}

export function coveredContracts(name) {
  return MANIFEST_COVERS.get(name)?.covers ?? [name];
}

export function surfaceProblems(root = repoRoot) {
  const known = new Set(everyComponent(root));
  const problems = [];
  for (const [manifest, entry] of MANIFEST_COVERS) {
    if (!known.has(manifest)) problems.push(`MANIFEST_COVERS names ${manifest}, and no component is called that`);
    if (!entry.reason?.trim()) problems.push(`MANIFEST_COVERS names ${manifest} with no reason, and a reason is the whole entry`);
    for (const covered of entry.covers)
      if (!known.has(covered)) problems.push(`MANIFEST_COVERS says ${manifest} covers ${covered}, and no component is called that`);
  }
  for (const [name, reason] of HAND_DRAWN) {
    if (!known.has(name)) problems.push(`HAND_DRAWN names ${name}, and no component is called that`);
    else if (hasOwnManifest(name, root)) {
      problems.push(`HAND_DRAWN names ${name}, and a manifest for it is now on disk -- delete the entry, `
        + 'because a component with a surface to render is not one that draws by hand');
    }
    if (!reason?.trim()) problems.push(`HAND_DRAWN names ${name} with no reason, and a reason is the whole entry`);
  }
  if (HAND_DRAWN.size === 0) {
    problems.push('HAND_DRAWN is empty, and the gates that read it lose their subject rather than '
      + 'passing over nothing; delete those halves before emptying this map');
  }
  return problems;
}
