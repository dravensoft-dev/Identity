/** Projection marker directives. Naming rule for a new one: prefix the attribute with
 *  `arena-` (`[arena-action]`, `[arena-actions]`) by default, and depart from that only
 *  when a brief's own projection interface fixes the bare attribute name, as
 *  `ArenaBrand`/`ArenaFooter`'s `[brand]`/`[footer]` did. */
import { Directive } from '@angular/core';

/** Marks the element a consumer projects into a component's single action slot,
 *  matching the `[arena-action]` attribute the projecting component's `ng-content
 *  select` already uses. Angular content queries do not accept a CSS selector as a
 *  locator (only a directive/component type, a template reference variable, or a DI
 *  token), so detecting whether an action was actually projected needs a real
 *  directive matching that attribute. Declared once here and imported by every
 *  primitive that projects a single action (`EmptyState`, `ErrorState`) — a second
 *  primitive declaring its own class on the identical `[arena-action]` selector would
 *  stamp two dead directive instances on one projected node the moment a consumer
 *  imported both. A consumer wiring an action imports `ArenaAction` alongside the
 *  primitive it is projecting into. */
@Directive({ selector: '[arena-action]', standalone: true })
export class ArenaAction {}

/** Same mechanism as `ArenaAction`, for the plural `[arena-actions]` attribute a
 *  component with a multi-action or toolbar-style projected slot uses. Declared once
 *  here for the same reason `ArenaAction` is — so two primitives sharing the plural
 *  selector never redeclare it. A consumer wiring one or more actions imports
 *  `ArenaActions` alongside the primitive it is projecting into. */
@Directive({ selector: '[arena-actions]', standalone: true })
export class ArenaActions {}

/** Marks the element a consumer projects into `arena-unauth-card`'s `[brand]` slot,
 *  matching the `[brand]` attribute its `ng-content select` uses. Declared once here
 *  for the same reason `ArenaAction` is, so a future second primitive with a lock-up
 *  slot never redeclares the selector. A consumer wiring a brand lock-up imports
 *  `ArenaBrand` alongside `UnauthCard`. */
@Directive({ selector: '[brand]', standalone: true })
export class ArenaBrand {}

/** Same mechanism as `ArenaBrand`, for `arena-unauth-card`'s `[footer]` slot. A
 *  consumer wiring footer content imports `ArenaFooter` alongside `UnauthCard`. */
@Directive({ selector: '[footer]', standalone: true })
export class ArenaFooter {}
