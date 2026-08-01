import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { commandPaletteStyles } from './CommandPalette.variants';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../../../FocusTrap';
import type { Command } from '../../../Api.generated';

let nextId = 0;

export function filterCommands(commands: readonly Command[], query: string): Command[] {
  const needle = query.toLowerCase();
  return commands.filter((command) => `${command.label} ${command.hint ?? ''}`.toLowerCase().includes(needle));
}

export function nextActiveIndex(current: number, key: 'ArrowDown' | 'ArrowUp', count: number): number {
  if (count === 0) return 0;
  const last = count - 1;
  return key === 'ArrowDown' ? Math.min(current + 1, last) : Math.max(current - 1, 0);
}

export function scrollRowIntoView(list: HTMLElement, index: number): void {
  const row = list.children.item(index);
  if (row instanceof HTMLElement) row.scrollIntoView({ block: 'nearest' });
}

export function optionRowId(uid: string, index: number): string {
  return `${uid}-option-${index}`;
}

export function activeOptionId(uid: string, active: number, rowCount: number): string | undefined {
  return active >= 0 && active < rowCount ? optionRowId(uid, active) : undefined;
}

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
                    [class]="styles().row() + ' ' + (i === active() ? styles().rowActive() : styles().rowDefault())"
                    (mouseenter)="onHover(i)" (click)="onRun(command)">
              @if (command.icon; as glyph) {
                <span [class]="styles().rowIcon()"><i [class]="glyph" aria-hidden="true"></i></span>
              }
              <span [class]="styles().rowLabel() + ' ' + (i === active() ? styles().rowLabelActive() : styles().rowLabelDefault())">{{ command.label }}</span>
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
  /** Whether the palette is shown. Closed renders nothing. */
  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });
  /** Every command the palette can find. Filtered by label and hint as the user types. */
  readonly commands = input.required<Command[]>();
  /** The search field's placeholder. */
  readonly placeholder = input('Search for an action or project…');
  /** The palette asked to be closed — Escape, the scrim, or a command having been run. */
  readonly close = output<void>();
  /** A command was activated, carrying which one. Emitted after close. */
  readonly run = output<Command>();

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
      if (command) this.onRun(command);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    } else if (event.key === 'Tab') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapTabKey(panel, event, this.doc.activeElement);
    }
  }

  protected onRun(command: Command): void {
    this.close.emit();
    this.run.emit(command);
  }

  protected onScrimClick(): void {
    if (this.open()) this.close.emit();
  }
}
