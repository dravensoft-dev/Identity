import React, { useEffect, useState } from 'react';
import { injectInto, indentFor } from './side-nav-inject.jsx';
import { SideNavItem } from './SideNavItem.jsx';

/** Whether `id` names a SideNavItem anywhere in this subtree.
 *
 *  Matched by element TYPE and not by `props.id` alone: a collapsible carries an
 *  id of its own, and a consumer who names a group after a destination has not
 *  said the group IS that destination. Importing SideNavItem for the comparison
 *  makes no cycle -- SideNavItem imports only the shared helpers.
 *
 *  Exported so its own test can exercise it without a render.
 *  @param {React.ReactNode} children @param {string} [id] */
export function subtreeHasItem(children, id) {
  if (!id) return false;
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue;
    if (child.type === SideNavItem && child.props.id === id) return true;
    if (subtreeHasItem(child.props.children, id)) return true;
  }
  return false;
}

/** A named group that shows and hides its own contents. Binds the `disclosure`
 *  pattern: a real <button> carrying aria-expanded, with aria-controls naming the
 *  region it toggles.
 *
 *  IT IS NOT A TREEVIEW, and the binding says so. With arbitrary nesting the
 *  structure resembles one, and APG's treeview would demand aria-level on every
 *  node, a roving tab stop and four-direction arrow navigation. None of that is
 *  designed here: each collapsible is an independent disclosure, which is what
 *  production sidebars ship and what a nav landmark full of links actually is. */
export function SideNavCollapsible({
  id, label, icon, defaultExpanded = false, children, onToggle,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {
  /* Falsy rather than absence-only, the same operator decision SideNavItem's
   * guards carry: `label` is the trigger's whole accessible name and `id` is
   * what both DOM ids are derived from, so a present-but-blank value IS the
   * defect -- a blank id would produce the pair "-trigger"/"-region", which two
   * blank-id collapsibles on one page would share. */
  if (!id) throw new Error('SideNavCollapsible: `id` is required');
  if (!label) throw new Error('SideNavCollapsible: `label` is required');

  const holdsActive = subtreeHasItem(children, activeId);
  /* Seeded AND effected, and both halves are load-bearing. Seeding alone never
   * reopens the group when the route moves into it; an effect alone renders the
   * active destination HIDDEN in a server pass, because effects do not run under
   * renderToStaticMarkup. Together they open it on first paint and on every later
   * transition into holding the active id -- and leave the user free to collapse
   * it again, which a derived `expanded || holdsActive` would not. */
  const [expanded, setExpanded] = useState(defaultExpanded || holdsActive);
  useEffect(() => { if (holdsActive) setExpanded(true); }, [holdsActive]);

  /* Derived from the required `id` rather than from useId(): a useId value cannot
   * be addressed from outside, and api/README.md's rule about when `id` is a
   * member is precisely that a component generating one takes the consumer's only
   * path to that element away. SideNavSection has no such need and uses useId. */
  const regionId = `${id}-region`;
  const triggerId = `${id}-trigger`;

  /* `toggle` reports the BUTTON PRESS only. The auto-expand above is Arena's
   * decision, not the user's, and reporting it as one would be a lie a consumer
   * persists. */
  const press = () => {
    const next = !expanded;
    setExpanded(next);
    if (onToggle) onToggle(next);
  };

  const glyph = icon
    ? <i className={icon} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <button id={triggerId} type="button" aria-expanded={expanded} aria-controls={regionId}
        onClick={press}
        style={{
          display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
          paddingBlock: 'calc(var(--sp-1) * 2.5)',
          paddingInlineEnd: 'calc(var(--sp-1) * 3)',
          paddingInlineStart: indentFor(indentStep, depth),
          borderRadius: 'var(--r-sm)', background: 'transparent', color: 'var(--mute)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', fontWeight: 'var(--fw-medium)',
        }}>
        {glyph}
        <span style={{ flex: 1 }}>{label}</span>
        <i className={expanded ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}
          aria-hidden="true" style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }} />
      </button>
      {/* `hidden` AND display, never one of them -- an inline display:flex beats
          [hidden]'s UA display:none, and hidden alone would lose the column. */}
      <div id={regionId} role="group" aria-labelledby={triggerId} hidden={!expanded}
        style={{ display: expanded ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--sp-1)' }}>
        {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
      </div>
    </div>
  );
}
