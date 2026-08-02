import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  selector, typeExpr, importPath, markerNames, collectFields, escapeText, renderSubject, renderTree,
  knobsInterface, angularEntry, angularPage, MARKERS_SOURCE,
} from './playground-angular.mjs';
import { repoRoot as root } from '../arena/repo-root.mjs';

const places = new Map([
  ['Card', { name: 'Card', category: 'display', dir: 'card', self: true }],
  ['Badge', { name: 'Badge', category: 'display', dir: 'badge' }],
  ['Table', { name: 'Table', category: 'display', dir: 'table' }],
]);

const contracts = new Map([
  ['Badge', { api: { tone: { form: 'enum', type: 'Tone' }, content: { form: 'slot' } } }],
  ['Table', { api: { label: { form: 'primitive', type: 'string' }, content: { form: 'slot' } } }],
]);

const MARKERS = "@Directive({ selector: '[action]', standalone: true }) export class ArenaAction {}\n"
  + "@Directive({ selector: '[footer]', standalone: true }) export class ArenaFooter {}\n";

const knob = (over) => ({
  member: 'x', form: 'primitive', type: 'string', bind: 'optional', bound: false,
  control: 'text', codec: 'raw', initial: '', nodes: null, doc: 'A member.', ...over,
});

const model = {
  component: 'Card',
  description: 'A surface.',
  note: 'A note.',
  affordances: [],
  knobs: [
    knob({ member: 'title', bind: 'pinned' }),
    knob({ member: 'tone', form: 'enum', type: 'Tone', bind: 'defaulted', control: 'select', options: ['neutral'] }),
    knob({ member: 'content', form: 'slot', type: null, control: 'slotText', initial: 'Body.', nodes: [{ text: 'Body.' }] }),
    knob({
      member: 'action', form: 'slot', type: null, control: 'slotPresence', codec: 'flag', initial: true,
      nodes: [{ component: 'Badge', members: { tone: 'success' }, slots: { content: [{ text: 'Live' }] } }],
    }),
  ],
  events: [
    { name: 'click', payload: null, bind: null, doc: 'Clicked.' },
    { name: 'sortChange', payload: 'TableSort', bind: 'sort', doc: 'Sorted.' },
  ],
  host: null,
  uses: ['Badge'],
};

function entry() {
  return angularEntry(model, places, contracts, MARKERS, '');
}

test('a selector is derived from the component name, never listed', () => {
  assert.equal(selector('Card'), 'arena-card');
  assert.equal(selector('TableRow'), 'arena-table-row');
  assert.equal(selector('AppLogo'), 'arena-app-logo');
});

test('a marker directive is read from the layer\'s own source, so a new one joins with no edit here', () => {
  const found = markerNames(MARKERS);
  assert.deepEqual([...found.entries()], [['action', 'ArenaAction'], ['footer', 'ArenaFooter']]);
});

test('every marker the real source declares is found, or a projected slot would silently not report', () => {
  const found = markerNames(readFileSync(join(root, MARKERS_SOURCE), 'utf8'));
  assert.ok(found.size >= 4, `only ${found.size} marker(s) parsed out of the layer's own source`);
  assert.equal(found.get('action'), 'ArenaAction');
});

test('a type expression follows the form, the same way the other layer\'s does', () => {
  assert.equal(typeExpr(knob({ form: 'array', type: 'TableColumn' })), 'TableColumn[]');
  assert.equal(typeExpr(knob({ form: 'slot', control: 'slotPresence' })), 'boolean');
});

test('a component is reached without an extension, which is what the layer\'s own imports do', () => {
  assert.equal(importPath(places.get('Badge')), '../../display/badge/Badge');
});

test('a literal becomes a typed field rather than template text, so nothing has to be escaped twice', () => {
  const node = { component: 'Badge', members: { tone: 'success' }, slots: {} };
  const fields = collectFields(node, contracts, [], 'slot');
  assert.equal(fields.length, 1);
  assert.equal(fields[0].type, 'Tone');
  assert.equal(fields[0].value, 'success');
  assert.match(entry(), /protected readonly \w+: Tone = "success";/);
});

test('template syntax inside fixture copy is neutralised rather than executed', () => {
  assert.equal(escapeText('a {{ b }} c'), 'a {{ "{{" }} b }} c');
  assert.equal(escapeText('a `b` ${c}'), 'a \\`b\\` \\${c}');
});

test('every member is written out, because this layer has no spread', () => {
  const out = renderSubject(model, places, [], new Map(), 0, new Set());
  assert.match(out, /\[title\]="k\(\)\.title"/);
  assert.match(out, /\[tone\]="k\(\)\.tone"/);
});

test('a void event takes no $event and a payload event forwards one', () => {
  const out = renderSubject(model, places, [], new Map(), 0, new Set());
  assert.match(out, /\(click\)="play\.fire\('click'\)"/);
  assert.match(out, /\(sortChange\)="play\.fire\('sortChange', \$event\)"/);
});

test('a named slot is wrapped in @if, because a marked element counts as filled even when empty', () => {
  const out = renderSubject(model, places, [{ node: model.knobs[3].nodes[0], member: 'tone', name: 'f0' }], markerNames(MARKERS), 0, new Set());
  assert.match(out, /@if \(k\(\)\.action\) \{/);
  assert.match(out, /<arena-badge action/);
});

test('a text slot is guarded on undefined rather than on truthiness, so an empty string still renders', () => {
  const out = renderSubject(model, places, [], new Map(), 0, new Set());
  assert.match(out, /@if \(k\(\)\.content !== undefined\) \{/);
});

test('a marker directive joins imports only when a slot it covers is projected', () => {
  assert.match(entry(), /imports: \[Playground, ArenaAction, Badge, Card\]/);
  const noSlot = { ...model, knobs: model.knobs.slice(0, 2), uses: [] };
  assert.doesNotMatch(angularEntry(noSlot, places, contracts, MARKERS, ''), /ArenaAction/);
});

test('a host wraps the subject where the placeholder marks', () => {
  const hosted = { ...model, host: { component: 'Table', members: { label: 'L' }, slots: { content: ['$subject'] } } };
  const fields = collectFields(hosted.host, contracts, [], 'host');
  const out = renderTree(hosted, places, fields, new Map(), 0, new Set());
  assert.match(out, /^<arena-table \[label\]="host\w+"/);
  assert.match(out, /<arena-card/);
  assert.match(out, /<\/arena-table>$/);
});

test('a required member is not optional in the interface', () => {
  assert.match(knobsInterface(model), /^ {2}title: string;$/m);
  assert.match(knobsInterface(model), /^ {2}content\?: string;$/m);
});

test('the entry opens with the compiler import and bootstraps zoneless, which the gate requires', () => {
  const out = angularEntry(model, places, contracts, MARKERS, '/* banner */\n');
  assert.match(out, /^\/\* banner \*\/\nimport '@angular\/compiler';$/m);
  assert.match(out, /bootstrapApplication\(Demo, \{ providers: \[provideZonelessChangeDetection\(\)\] \}\)/);
  assert.match(out, /const MODEL: KnobModel = \{/);
});

test('the page mounts demo-root, loads its bundle and declares no card', () => {
  const page = angularPage(model, '<!-- banner -->\n');
  assert.match(page, /<demo-root><\/demo-root>/);
  assert.match(page, /build\/demo\/js\/Card\.demo\.entry\.generated\.js/);
  assert.doesNotMatch(page, /@dsCard/);
  assert.match(page, /Utilities\.generated\.css/);
});
