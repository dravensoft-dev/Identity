import React from 'react';
import {
  applyBind, baseState, boundValues, describePayload, nextEntries, readState, searchUrl, writeSearch,
} from './PlaygroundCodec.generated.ts';
import type { KnobModel, LogEntry, PlaygroundState } from './PlaygroundCodec.generated.ts';

export * from './PlaygroundCodec.generated.ts';

export interface Playground {
  model: KnobModel;
  state: PlaygroundState;
  values: Record<string, unknown>;
  entries: LogEntry[];
  setValue: (member: string, value: unknown) => void;
  setBound: (member: string, on: boolean) => void;
  fire: (name: string, payload?: unknown) => void;
  reset: () => void;
}

export function usePlayground(model: KnobModel): Playground {
  const [state, setState] = React.useState<PlaygroundState>(() => readState(model, window.location.search));
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const nextId = React.useRef(0);

  React.useEffect(() => {
    const search = writeSearch(model, state, window.location.search);
    window.history.replaceState(null, '', searchUrl(window.location.pathname, search));
  }, [model, state]);

  const setValue = React.useCallback((member: string, value: unknown) => {
    setState((current) => ({ ...current, held: { ...current.held, [member]: value } }));
  }, []);

  const setBound = React.useCallback((member: string, on: boolean) => {
    setState((current) => ({ ...current, bound: { ...current.bound, [member]: on } }));
  }, []);

  const fire = React.useCallback((name: string, payload?: unknown) => {
    nextId.current += 1;
    const id = nextId.current;
    setEntries((all) => nextEntries(all, { id, name, payload: describePayload(payload) }));
    const event = model.events.find((one) => one.name === name);
    if (event?.bind) setState((current) => applyBind(current, event.bind, payload));
  }, [model]);

  const reset = React.useCallback(() => setState(baseState(model)), [model]);

  return { model, state, values: boundValues(model, state), entries, setValue, setBound, fire, reset };
}
