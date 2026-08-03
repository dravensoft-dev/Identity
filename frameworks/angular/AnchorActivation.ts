export interface ActivationModifiers {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function isPrimaryActivation(event: ActivationModifiers): boolean {
  return event.button === 0
    && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
