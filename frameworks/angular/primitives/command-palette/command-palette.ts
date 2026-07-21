import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { commandPaletteStyles } from './command-palette.variants';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../focus-trap';

let nextId = 0;

/** One entry in the palette. `hint` is searched but never shown, so a
 *  command can be found by a synonym that never appears in its label --
 *  React's `CommandPalette.jsx` filters the same way. */
export interface ArenaCommand {
  id?: string;
  label: string;
  hint?: string;
  icon?: string;
  shortcut?: string;
}

/** Commands whose `label` or `hint` contains `query`, case-insensitively --
 *  the same predicate React's `CommandPalette.jsx` filters with. Exported as
 *  a plain function of its arguments so the filter is testable with no
 *  Angular runtime at all.
 *  @param commands the full command list
 *  @param query the text typed into the search field
 *  @returns the commands whose label or hint matches, in their original order */
export function filterCommands(commands: readonly ArenaCommand[], query: string): ArenaCommand[] {
  const needle = query.toLowerCase();
  return commands.filter((command) => `${command.label} ${command.hint ?? ''}`.toLowerCase().includes(needle));
}

/** The next active row index for an arrow key press, clamped to the list's
 *  bounds. `count === 0` always answers `0`, since there is nothing to move
 *  to. Exported as a plain function so the clamping is testable with no
 *  Angular runtime and no DOM at all.
 *  @param current the active index before the key press
 *  @param key `'ArrowDown'` or `'ArrowUp'`
 *  @param count how many rows are currently visible
 *  @returns the clamped next index */
export function nextActiveIndex(current: number, key: 'ArrowDown' | 'ArrowUp', count: number): number {
  if (count === 0) return 0;
  const last = count - 1;
  return key === 'ArrowDown' ? Math.min(current + 1, last) : Math.max(current - 1, 0);
}

/** Scrolls the row at `index` into view within `list`, if a row exists at
 *  that position -- keeps the active row visible while arrowing past the
 *  edge of the scroll area, which hovering a row never needs since the
 *  mouse is already over a visible one. Exported as a plain DOM function so
 *  it is testable against a hand-built element tree, independent of whether
 *  Angular's own inputs can be driven in this harness.
 *  @param list the rendered row container
 *  @param index the row to bring into view */
export function scrollRowIntoView(list: HTMLElement, index: number): void {
  const row = list.children.item(index);
  if (row instanceof HTMLElement) row.scrollIntoView({ block: 'nearest' });
}

/** The DOM id the row rendered at `index` carries, given the palette
 *  instance's unique `uid` prefix. Exported as a plain function of its
 *  arguments so `activeOptionId` can build on it and be tested with no
 *  Angular runtime and no DOM at all.
 *  @param uid the palette instance's unique id prefix
 *  @param index the row's position in the filtered list
 *  @returns the id that row's `role="option"` element carries */
export function optionRowId(uid: string, index: number): string {
  return `${uid}-option-${index}`;
}

/** The id `aria-activedescendant` should carry: the active row's own id when
 *  a row actually exists at that index, or `undefined` when the filtered
 *  list is empty -- the single most load-bearing piece of the combobox's
 *  ARIA wiring, since a screen reader announces whatever this points at, and
 *  pointing it at an id with no matching element is worse than omitting the
 *  attribute outright. Exported as a plain function of its arguments so this
 *  property is testable with no Angular runtime and no DOM at all: it always
 *  points at a real, existing row id, and is `undefined` rather than
 *  dangling when there is none.
 *  @param uid the palette instance's unique id prefix
 *  @param active the active row index
 *  @param rowCount how many rows are currently visible
 *  @returns the active row's DOM id, or `undefined` when no row exists there */
export function activeOptionId(uid: string, active: number, rowCount: number): string | undefined {
  return active >= 0 && active < rowCount ? optionRowId(uid, active) : undefined;
}

/** Keyboard-first action launcher (Cmd/Ctrl+K). Type to filter, arrow to a
 *  command, Enter to run it, Escape to leave, or hover a row to select it --
 *  a palette that needs the mouse is not a palette. Fully controlled: the
 *  host owns `open` and reacts to `closed`/`run` the same way it reacts to
 *  `arena-confirm-dialog`'s `cancelled`/`confirmed`. Running a command does
 *  not close the palette by itself here, unlike React's
 *  `CommandPalette.jsx`, which calls `onClose` unconditionally before
 *  invoking a command -- see `components-divergences.md`.
 *
 *  The host itself is the recipe's `root`, the fixed full-viewport scrim --
 *  `open` drives it between the overlay and `hidden` rather than a wrapper
 *  element omitting itself, matching `arena-confirm-dialog` and
 *  `arena-onboarding`. Like `arena-onboarding`, this scrim IS dismissible:
 *  clicking it emits `closed`, the same as React's `onClick={onClose}` on
 *  its own scrim div. The panel is a descendant of the host here, not a
 *  sibling the way React renders it, so it stops that click's propagation
 *  itself.
 *
 *  Accessible as an editable combobox with a listbox popup (ARIA 1.2): the
 *  search input carries `role="combobox"` with `aria-expanded`,
 *  `aria-controls` and `aria-activedescendant` pointing at the active row's
 *  id, and each row carries `role="option"` with `aria-selected`.
 *  `aria-expanded` stays statically `true`: the listbox popup is always
 *  mounted and visible for as long as the combobox itself is open, including
 *  with zero matching rows (that state renders a "No results" message as a
 *  sibling of the listbox rather than inside it, since a listbox's children
 *  must be `option`/`group`, never a bare `div`), so there is no collapsed
 *  state for `aria-expanded` to distinguish. React's `CommandPalette.jsx`
 *  sets none of this ARIA wiring -- a screen reader user gets no indication
 *  of which row is active, or that the input drives a list at all -- see
 *  `components-divergences.md`.
 *
 *  DOM focus is moved into the search input explicitly on open and restored
 *  to whatever held it beforehand on close -- never a bare `autofocus`
 *  attribute, which the HTML autofocus processing model skips once the
 *  document's autofocus-processed flag is set, which opening this palette
 *  from a keyboard shortcut or a click always has by the time `@if (open())`
 *  inserts the input. Every row stays `tabindex="-1"`, so the input is the
 *  panel's only legal Tab stop; Tab and Shift+Tab are still trapped there --
 *  with exactly one focusable element the trap simply re-focuses it and
 *  consumes the key -- so focus can never escape to the page behind the
 *  scrim. All of this reuses `arena-confirm-dialog`'s own focus contract,
 *  generalized into `frameworks/angular/primitives/focus-trap.ts`
 *  (`handleOpenTransition`, `trapTabKey`) rather than reimplemented here. */
@Component({
  selector: 'arena-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'styles().root()',
    '(click)': 'onScrimClick()',
  },
  template: `
    @if (open()) {
      <div #panel [class]="styles().panel()" role="dialog" aria-modal="true" aria-label="Command palette"
           (click)="$event.stopPropagation()">
        <div [class]="styles().search()">
          <i [class]="styles().searchIcon() + ' ph-bold ph-magnifying-glass'" aria-hidden="true"></i>
          <input [class]="styles().input()" [value]="query()" [attr.placeholder]="placeholder()"
                 role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true"
                 [attr.aria-controls]="listboxId" [attr.aria-activedescendant]="activeId()"
                 [attr.aria-label]="placeholder() || 'Search commands'"
                 (input)="onQuery($event)" (keydown)="onKey($event)" />
          <span [class]="styles().esc()">ESC</span>
        </div>
        <div #list [class]="styles().list()" [id]="listboxId" role="listbox" aria-label="Commands">
          @for (command of filtered(); track command.id ?? command.label; let i = $index) {
            <button type="button" [id]="optionId(i)" role="option" [attr.aria-selected]="i === active()" tabindex="-1"
                    [class]="styles().row() + (i === active() ? ' ' + styles().rowActive() : '')"
                    (mouseenter)="onHover(i)" (click)="run.emit(command)">
              @if (command.icon; as glyph) {
                <span [class]="styles().rowIcon()"><i [class]="glyph" aria-hidden="true"></i></span>
              }
              <span [class]="styles().rowLabel() + (i === active() ? ' ' + styles().rowLabelActive() : '')">{{ command.label }}</span>
              @if (command.shortcut; as shortcut) {
                <span [class]="styles().shortcut()">{{ shortcut }}</span>
              }
            </button>
          }
        </div>
        @if (filtered().length === 0) {
          <div [class]="styles().empty()">No results for "{{ query() }}".</div>
        }
      </div>
    }
  `,
})
export class CommandPalette {
  readonly open = input(false);
  readonly commands = input<ArenaCommand[]>([]);
  readonly placeholder = input('Search for an action or project…');
  readonly closed = output<void>();
  readonly run = output<ArenaCommand>();

  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly styles = computed(() => commandPaletteStyles({ open: this.open() }));
  protected readonly filtered = computed(() => filterCommands(this.commands(), this.query()));

  private readonly doc = inject(DOCUMENT);
  private readonly uid = `arena-command-palette-${nextId++}`;
  protected readonly listboxId = `${this.uid}-listbox`;
  protected readonly activeId = computed(() => activeOptionId(this.uid, this.active(), this.filtered().length));

  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Bookkeeping `handleOpenTransition` mutates across renders -- a plain
   *  object rather than a signal, matching `arena-confirm-dialog`'s own
   *  field, for the identical reason: reading it inside the effect below
   *  must never register as a dependency, or writing it there would make
   *  the effect re-run itself. */
  private readonly focusTrap: FocusTrapState = { wasOpen: false, restoreTo: null };

  constructor() {
    effect(() => {
      if (this.open()) {
        this.query.set('');
        this.active.set(0);
      }
    });
    afterRenderEffect(() => {
      const isOpen = this.open();
      untracked(() => {
        handleOpenTransition(this.focusTrap, isOpen, this.panel()?.nativeElement ?? null, this.doc.activeElement);
      });
    });
    afterRenderEffect(() => {
      const index = this.active();
      const hasRows = this.filtered().length > 0;
      untracked(() => {
        const list = this.list()?.nativeElement;
        if (list && hasRows) scrollRowIntoView(list, index);
      });
    });
  }

  protected optionId(index: number): string {
    return optionRowId(this.uid, index);
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected onHover(index: number): void {
    this.active.set(index);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((current) => nextActiveIndex(current, event.key as 'ArrowDown' | 'ArrowUp', this.filtered().length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.filtered()[this.active()];
      if (command) this.run.emit(command);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
    } else if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapTabKey(panel, event, this.doc.activeElement);
    }
  }

  protected onScrimClick(): void {
    if (this.open()) this.closed.emit();
  }
}
