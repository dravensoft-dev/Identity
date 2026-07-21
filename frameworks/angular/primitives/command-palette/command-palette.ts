import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { commandPaletteStyles } from './command-palette.variants';

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
 *  id, and each row carries `role="option"` with `aria-selected`. React's
 *  `CommandPalette.jsx` sets none of this -- a screen reader user gets no
 *  indication of which row is active, or that the input drives a list at
 *  all -- see `components-divergences.md`. Selection stays virtual: DOM
 *  focus never leaves the input (`tabindex="-1"` keeps every row out of the
 *  tab order), so no separate focus trap is needed the way
 *  `arena-confirm-dialog` needs one for its several interactive controls. */
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
      <div [class]="styles().panel()" role="dialog" aria-modal="true" aria-label="Command palette"
           (click)="$event.stopPropagation()">
        <div [class]="styles().search()">
          <i [class]="styles().searchIcon() + ' ph-bold ph-magnifying-glass'" aria-hidden="true"></i>
          <input [class]="styles().input()" [value]="query()" [attr.placeholder]="placeholder()"
                 role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true"
                 [attr.aria-controls]="listboxId" [attr.aria-activedescendant]="activeId()"
                 [attr.aria-label]="placeholder()"
                 (input)="onQuery($event)" (keydown)="onKey($event)" autofocus />
          <span [class]="styles().esc()">ESC</span>
        </div>
        <div #list [class]="styles().list()" [id]="listboxId" role="listbox" aria-label="Commands">
          @if (filtered().length === 0) {
            <div [class]="styles().empty()">No results for "{{ query() }}".</div>
          }
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

  private readonly uid = `arena-command-palette-${nextId++}`;
  protected readonly listboxId = `${this.uid}-listbox`;
  protected readonly activeId = computed(() => (this.filtered()[this.active()] ? this.optionId(this.active()) : undefined));

  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.query.set('');
        this.active.set(0);
      }
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
    return `${this.uid}-option-${index}`;
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
    }
  }

  protected onScrimClick(): void {
    if (this.open()) this.closed.emit();
  }
}
