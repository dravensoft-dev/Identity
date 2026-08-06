/* Emits an Angular demo entry from the layer-neutral model. Two rules earn their keep here.
 * A literal inside a fixture node becomes a typed class field rather than template text,
 * because inlining it would mean escaping both the template's quotes and the surrounding
 * backtick's ${; and a named slot is wrapped in @if, because a host querying contentChild
 * counts an empty marked element as filled, so blanking the text would render a header in
 * this layer and none in the other. A marker directive is read from the layer's own source
 * rather than listed here, so a new one joins without an edit. */

import { playgroundPage, sheetLinks } from '../arena/playground-page.ts';
import { kebab } from '../arena/layers.ts';

export const PRIMITIVES = new Set(['string', 'number', 'boolean']);

export const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

export const VALIDATOR_TABLE = `
const VALIDATORS: Record<string, (value: string) => string> = {
  nonEmpty: (value: string) => (value.trim().length === 0 ? 'Required.' : ''),
  alwaysInvalid: () => 'Never valid, on purpose.',
};

function validatorFor(name: string | undefined): ((value: string) => string) | undefined {
  return name === undefined ? undefined : VALIDATORS[name];
}
`;

export const MARKERS_SOURCE = 'frameworks/angular/ProjectionMarkers.ts';

export function markerNames(source) {
  const found = new Map();
  for (const [, selector, name] of source.matchAll(/selector:\s*'\[(\w+)\]'[^}]*}\)\s*export class (\w+)/g)) {
    found.set(selector, name);
  }
  return found;
}

export function selector(name) {
  return kebab(name);
}

export function typeExpr(knob) {
  if (knob.form === 'slot') return knob.control === 'slotText' ? 'string' : 'boolean';
  if (knob.form === 'array') return `${knob.type}[]`;
  if (knob.form === 'functionInput') return 'string';
  return knob.type;
}

export function contractTypes(model, fields) {
  const names = new Set();
  for (const knob of model.knobs) {
    if (knob.form === 'enum' || knob.form === 'object') names.add(knob.type);
    if (knob.form === 'array' && !PRIMITIVES.has(knob.type)) names.add(knob.type);
  }
  for (const field of fields) if (field.type && !PRIMITIVES.has(field.type.replace('[]', ''))) {
    names.add(field.type.replace('[]', ''));
  }
  return [...names].sort();
}

export function importPath(place) {
  return `../../${place.category}/${place.dir}/${place.name}`;
}

export function fieldTypeFor(spec) {
  if (spec.form === 'array') return `${spec.of}[]`;
  if (spec.form === 'primitive' || spec.form === 'enum' || spec.form === 'object') return spec.type;
  return 'unknown';
}

export function staticAttribute(value) {
  return typeof value === 'string';
}

export function attributeText(value) {
  return escapeText(String(value)).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function collectFields(node, contracts, into, prefix) {
  if (node === '$subject' || node === null || typeof node !== 'object') return into;
  if (typeof node.component === 'string') {
    const api = contracts.get(node.component)?.api ?? {};
    for (const [member, value] of Object.entries(node.members ?? {}) as [string, any][]) {
      if (staticAttribute(value)) continue;
      const name = `${prefix}${node.component}${member[0].toUpperCase()}${member.slice(1)}${into.length}`;
      into.push({ name, type: fieldTypeFor(api[member] ?? {}), value, member, node });
    }
    for (const list of Object.values(node.slots ?? {}) as any[][]) {
      for (const one of list) collectFields(one, contracts, into, prefix);
    }
  }
  return into;
}

export function fieldFor(fields, node, member) {
  return fields.find((one) => one.node === node && one.member === member)?.name;
}

export function nodeAttributes(node, fields) {
  return (Object.entries(node.members ?? {}) as [string, any][])
    .map(([member, value]) => (staticAttribute(value)
      ? ` ${member}="${attributeText(value)}"`
      : ` [${member}]="${fieldFor(fields, node, member)}"`))
    .join('');
}

export function renderNode(node, places, fields, markers, depth, imports) {
  const pad = '  '.repeat(depth);
  if (typeof node.text === 'string' && !node.element) return `${pad}${escapeText(node.text)}`;
  if (typeof node.element === 'string' || typeof node.text === 'string') {
    const tag = node.element ?? 'span';
    const attrs = Object.entries(node.attrs ?? {}).map(([name, value]) => ` ${name}="${String(value)}"`).join('');
    if (VOID_ELEMENTS.has(tag)) return `${pad}<${tag}${attrs} />`;
    if (node.text === undefined) return `${pad}<${tag}${attrs}></${tag}>`;
    return `${pad}<${tag}${attrs}>${escapeText(node.text)}</${tag}>`;
  }

  const place = places.get(node.component);
  const tag = selector(place.name);
  imports.add(place.name);
  const slots = node.slots ?? {};
  const attrs = nodeAttributes(node, fields);
  const children = [];
  for (const [name, list] of Object.entries(slots) as [string, any[]][]) {
    for (const one of list) {
      const marked = name === 'content' ? '' : ` ${name}`;
      if (marked && markers.has(name)) imports.add(markers.get(name));
      children.push(projected(one, places, fields, markers, depth + 1, imports, marked));
    }
  }
  if (children.length === 0) return `${pad}<${tag}${attrs}></${tag}>`;
  return `${pad}<${tag}${attrs}>\n${children.join('\n')}\n${pad}</${tag}>`;
}

export function projected(node, places, fields, markers, depth, imports, marked) {
  const pad = '  '.repeat(depth);
  if (!marked) return renderNode(node, places, fields, markers, depth, imports);
  if (typeof node.text === 'string' && !node.element) return `${pad}<span${marked}>${escapeText(node.text)}</span>`;
  const rendered = renderNode(node, places, fields, markers, depth, imports).trimStart();
  return `${pad}${rendered.replace(/^(<[\w-]+)/, `$1${marked}`)}`;
}

export function escapeText(text) {
  return text.replace(/\{\{/g, '{{ "{{" }}').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

export function slotBlock(knob, places, fields, markers, depth, imports, marked) {
  const pad = '  '.repeat(depth);
  if (knob.control === 'slotText') {
    const body = marked ? `<span${marked}>{{ k().${knob.member} }}</span>` : `{{ k().${knob.member} }}`;
    return `${pad}@if (k().${knob.member} !== undefined) {\n${pad}  ${body}\n${pad}}`;
  }
  const nodes = (knob.nodes ?? [])
    .map((one) => projected(one, places, fields, markers, depth + 1, imports, marked));
  if (!marked) return `${pad}@if (k().${knob.member}) {\n${nodes.join('\n')}\n${pad}}`;
  return nodes.map((one) => `${pad}@if (k().${knob.member}) {\n${one}\n${pad}}`).join('\n');
}

export function renderSubject(model, places, fields, markers, depth, imports) {
  const pad = '  '.repeat(depth);
  const inner = `${pad}  `;
  const tag = selector(model.component);
  imports.add(model.component);

  const attrs = model.knobs
    .filter((knob) => knob.form !== 'slot')
    .map((knob) => (knob.form === 'functionInput'
      ? `\n${inner}[${knob.member}]="validatorFor(k().${knob.member})"`
      : `\n${inner}[${knob.member}]="k().${knob.member}"`))
    .concat(model.events.map((event) => (event.payload
      ? `\n${inner}(${event.name})="play.fire('${event.name}', $event)"`
      : `\n${inner}(${event.name})="play.fire('${event.name}')"`)))
    .join('');

  const slots = model.knobs.filter((knob) => knob.form === 'slot');
  if (slots.length === 0) return `${pad}<${tag}${attrs}></${tag}>`;

  const blocks = slots.map((knob) => {
    const marked = knob.member === 'content' ? '' : ` ${knob.member}`;
    const draws = knob.control === 'slotText' || (knob.nodes ?? []).length > 0;
    if (marked && draws && markers.has(knob.member)) imports.add(markers.get(knob.member));
    return slotBlock(knob, places, fields, markers, depth + 1, imports, marked);
  });
  return `${pad}<${tag}${attrs}>\n${blocks.join('\n')}\n${pad}</${tag}>`;
}

export function holdsSubject(node) {
  if (node === '$subject') return true;
  if (node === null || typeof node !== 'object') return false;
  return (Object.values(node.slots ?? {}) as any[][]).some((list) => list.some((one) => holdsSubject(one)));
}

export function renderTree(model, places, fields, markers, depth, imports) {
  if (model.host === null) return renderSubject(model, places, fields, markers, depth, imports);
  const wrap = (node, level) => {
    const pad = '  '.repeat(level);
    if (node === '$subject') return renderSubject(model, places, fields, markers, level, imports);
    if (!holdsSubject(node)) return renderNode(node, places, fields, markers, level, imports);
    const place = places.get(node.component);
    const tag = selector(place.name);
    imports.add(place.name);
    const attrs = nodeAttributes(node, fields);
    const children = [];
    for (const [name, list] of Object.entries(node.slots ?? {}) as [string, any[]][]) {
      for (const one of list) {
        const marked = name === 'content' ? '' : ` ${name}`;
        if (marked && markers.has(name)) imports.add(markers.get(name));
        children.push(holdsSubject(one)
          ? wrap(one, level + 1)
          : projected(one, places, fields, markers, level + 1, imports, marked));
      }
    }
    if (children.length === 0) return `${pad}<${tag}${attrs}></${tag}>`;
    return `${pad}<${tag}${attrs}>\n${children.join('\n')}\n${pad}</${tag}>`;
  };
  return wrap(model.host, depth);
}

export function knobsInterface(model) {
  const rows = model.knobs.map((knob) => {
    const optional = knob.bind === 'optional' ? '?' : '';
    return `  ${knob.member}${optional}: ${typeExpr(knob)};`;
  });
  return `interface Knobs {\n${rows.join('\n')}\n}`;
}

export function validatorTable(model) {
  return model.knobs.some((knob) => knob.form === 'functionInput') ? VALIDATOR_TABLE : '';
}

export function angularEntry(model, places, contracts, markersSource, banner) {
  const markers = markerNames(markersSource);
  const fields = [];
  collectFields(model.host, contracts, fields, 'host');
  for (const knob of model.knobs) {
    for (const node of knob.nodes ?? []) collectFields(node, contracts, fields, 'slot');
  }

  const imports = new Set();
  const template = renderTree(model, places, fields, markers, 3, imports);
  const used = [...imports].sort();
  const types = contractTypes(model, fields);

  const componentImports = [...new Set(used)]
    .filter((name) => places.has(name))
    .map((name) => `import { ${name} } from '${places.get(name).self ? `./${name}` : importPath(places.get(name))}';`);
  const markerImports = used.filter((name) => !places.has(name));

  const fieldRows = fields.map(
    (field) => `  protected readonly ${field.name}: ${field.type} = ${JSON.stringify(field.value)};`,
  );

  return `${banner}import '@angular/compiler';
import { ChangeDetectionStrategy, Component, computed, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Playground } from '../../../playground/Playground';
import { PlaygroundStore } from '../../../playground/PlaygroundState';
import type { KnobModel } from '../../../playground/PlaygroundCodec.generated';
${types.length > 0 ? `import type { ${types.join(', ')} } from '../../../Api.generated';\n` : ''}${
  markerImports.length > 0 ? `import { ${markerImports.join(', ')} } from '../../../ProjectionMarkers';\n` : ''
}${componentImports.join('\n')}

const MODEL: KnobModel = ${JSON.stringify(model, null, 2)};

${knobsInterface(model)}
${validatorTable(model)}
@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Playground, ${used.join(', ')}],
  template: \`
    <demo-playground [play]="play">
${template}
    </demo-playground>
  \`,
})
class Demo {
  protected readonly play = new PlaygroundStore(MODEL);
  protected readonly k = computed(() => this.play.values() as unknown as Knobs);
${model.knobs.some((knob) => knob.form === 'functionInput') ? '  protected readonly validatorFor = validatorFor;\n' : ''}
${fieldRows.length > 0 ? `${fieldRows.join('\n')}\n` : ''}}

bootstrapApplication(Demo, { providers: [provideZonelessChangeDetection()] });
`;
}

export function angularPage(model, banner) {
  return playgroundPage({
    component: model.component,
    banner,
    head: `${sheetLinks(model)}\n`,
    mount: '<demo-root></demo-root>',
    script: `../../../build/demo/js/${model.component}.demo.entry.generated.js`,
  });
}
