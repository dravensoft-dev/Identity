import { computed, signal } from '@angular/core';
import {
  applyBind, baseState, boundValues, describePayload, nextEntries, readState, searchUrl, writeSearch,
} from './PlaygroundCodec.generated';
import type { KnobModel, LogEntry, PlaygroundState } from './PlaygroundCodec.generated';

export * from './PlaygroundCodec.generated';

export class PlaygroundStore {
  private readonly current = signal<PlaygroundState>({ held: {}, bound: {} });
  private readonly log = signal<LogEntry[]>([]);
  private nextId = 0;

  readonly model: KnobModel;
  readonly state = computed(() => this.current());
  readonly values = computed(() => boundValues(this.model, this.current()));
  readonly entries = computed(() => this.log());

  constructor(model: KnobModel) {
    this.model = model;
    this.current.set(readState(model, window.location.search));
  }

  private commit(next: PlaygroundState): void {
    this.current.set(next);
    const search = writeSearch(this.model, next, window.location.search);
    window.history.replaceState(null, '', searchUrl(window.location.pathname, search));
  }

  setValue(member: string, value: unknown): void {
    const state = this.current();
    this.commit({ held: { ...state.held, [member]: value }, bound: state.bound });
  }

  setBound(member: string, on: boolean): void {
    const state = this.current();
    this.commit({ held: state.held, bound: { ...state.bound, [member]: on } });
  }

  fire(name: string, payload?: unknown): void {
    this.nextId += 1;
    this.log.set(nextEntries(this.log(), { id: this.nextId, name, payload: describePayload(payload) }));
    const event = this.model.events.find((one) => one.name === name);
    if (event?.bind) this.commit(applyBind(this.current(), event.bind, payload));
  }

  reset(): void {
    this.commit(baseState(this.model));
    this.log.set([]);
  }
}
