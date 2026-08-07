/* A deadline on a promise, for the gates that drive a browser and would otherwise hang until
 * the runner kills them with nothing said. Three copies wrote it and the third differed in a
 * way the other two would call a bug: it never cleared the timer and reached for `unref` to
 * keep the leak from holding the process open. This clears instead, which is the two, and
 * deliberately does NOT unref: an unreffed timer lets the process exit while the raced promise
 * is still pending, so a hang that should have arrived as `message` arrives as a silent exit 0
 * instead, and a gate reporting nothing is the one failure the deadline exists to prevent. */

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout>;
  const bound = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}
