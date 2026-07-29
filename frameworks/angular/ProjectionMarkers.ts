import { Directive } from '@angular/core';

@Directive({ selector: '[action]', standalone: true })
export class ArenaAction {}

@Directive({ selector: '[actions]', standalone: true })
export class ArenaActions {}

@Directive({ selector: '[brand]', standalone: true })
export class ArenaBrand {}

@Directive({ selector: '[footer]', standalone: true })
export class ArenaFooter {}

@Directive({ selector: '[secondaryAction]', standalone: true })
export class ArenaSecondaryAction {}
