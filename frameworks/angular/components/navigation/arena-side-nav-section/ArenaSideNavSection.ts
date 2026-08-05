import {
  ChangeDetectionStrategy, Component, computed, contentChildren, forwardRef, inject, input,
} from '@angular/core';
import { ArenaSideNavChild, ArenaSideNavState, arenaIndentFor } from '../arena-side-nav/ArenaSideNavState';
import { arenaSideNavStyles } from '../arena-side-nav/ArenaSideNav.variants';

let nextId = 0;

@Component({
  selector: 'arena-side-nav-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ArenaSideNavState,
    { provide: ArenaSideNavChild, useExisting: forwardRef(() => ArenaSideNavSection) },
  ],
  host: {
    '[class]': 'styles().section()',
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
  },
  template: `
    <div [id]="labelId" [class]="styles().sectionLabel()" [style.paddingInlineStart]="indent()">{{ heading() }}</div>
    <ng-content />
  `,
})
export class ArenaSideNavSection {
  /** Names the group, both on screen and to assistive technology. Required, and guarded at runtime: a blank label leaves the group with no accessible name, which is the defect the guard exists to prevent arriving through a value that is present, so the guard trims before it decides. */
  readonly label = input.required<string>();

  private readonly parent = inject(ArenaSideNavState, { skipSelf: true });
  private readonly own = inject(ArenaSideNavState);

  protected readonly labelId = `arena-side-nav-section-${nextId++}`;
  protected readonly children = contentChildren(ArenaSideNavChild);

  protected readonly heading = computed(() => {
    const text = this.label();
    if (text.trim() === '') {
      throw new Error('ArenaSideNavSection: `label` is required, and names the group its heading introduces');
    }
    return text;
  });

  protected readonly indent = computed(() => arenaIndentFor(this.parent.indentStep(), this.parent.depth()));
  protected readonly styles = computed(() => arenaSideNavStyles());

  constructor() {
    this.own.depth = computed(() => this.parent.depth() + 1);
    this.own.activeId = this.parent.activeId;
    this.own.indentStep = this.parent.indentStep;
    this.own.activate = (id: string) => this.parent.activate(id);
  }

  protected ngAfterContentInit(): void {
    if (this.children().length === 0) {
      throw new Error('ArenaSideNavSection: a section with no children is not a legal shape — its heading would name nothing');
    }
  }
}
