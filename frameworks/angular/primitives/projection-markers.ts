/** Projection marker directives. Naming rule for a new one: **the attribute IS the contract
 *  member's name, with no prefix.** `api/README.md`'s binding table is normative and
 *  mechanical -- a slot named `x` binds to `<ng-content select="[x]" />` -- so a prefixed
 *  attribute would declare a member literally named `arena-x`, which is not a member name any
 *  contract can carry. (This inverts the rule that stood until plan 8B0: the prefix was the
 *  default and a bare name the exception. The API contract layer decided it the other way,
 *  and `[brand]`/`[footer]` -- the two that were already bare -- are now the pattern rather
 *  than the departure from it.) */
import { Directive } from '@angular/core';

/** Marks the element a consumer projects into a component's single action slot,
 *  matching the `[action]` attribute the projecting component's `ng-content
 *  select` already uses. Angular content queries do not accept a CSS selector as a
 *  locator (only a directive/component type, a template reference variable, or a DI
 *  token), so detecting whether an action was actually projected needs a real
 *  directive matching that attribute. Declared once here and imported by every
 *  primitive that projects a single action (`EmptyState`, `ErrorState`) — a second
 *  primitive declaring its own class on the identical `[action]` selector would
 *  stamp two dead directive instances on one projected node the moment a consumer
 *  imported both. A consumer wiring an action imports `ArenaAction` alongside the
 *  primitive it is projecting into. */
@Directive({ selector: '[action]', standalone: true })
export class ArenaAction {}

/** Same mechanism as `ArenaAction`, for the plural `[actions]` attribute a
 *  component with a multi-action or toolbar-style projected slot uses. Declared once
 *  here for the same reason `ArenaAction` is — so two primitives sharing the plural
 *  selector never redeclare it. A consumer wiring one or more actions imports
 *  `ArenaActions` alongside the primitive it is projecting into. */
@Directive({ selector: '[actions]', standalone: true })
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
