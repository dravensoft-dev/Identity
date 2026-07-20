/* The Chrome DevTools Protocol, over a plain WebSocket.
 *
 * No dependency: CDP is JSON frames with an incrementing `id`, and both Bun
 * and node (>=22) expose a global WebSocket. Puppeteer would bring a browser
 * download and a package manifest for the sake of the same twenty lines.
 *
 * The dispatcher below is the whole protocol, and it is pure — it never
 * touches a socket, so it is testable without a browser. connect() is the
 * thin wiring around it.
 */

/** Request numbering and reply routing. Pure.
 *  @returns {{next: (method: string, params?: object, sessionId?: string) =>
 *              {frame: object, result: Promise<any>},
 *             settle: (message: object) => boolean,
 *             drain: (err: Error) => void,
 *             pending: Map<number, {resolve: Function, reject: Function}>}} */
export function createDispatcher() {
  let id = 0;
  const pending = new Map();

  return {
    pending,
    next(method, params = {}, sessionId) {
      const frame = { id: ++id, method, params };
      if (sessionId) frame.sessionId = sessionId;
      const result = new Promise((resolve, reject) => pending.set(frame.id, { resolve, reject }));
      return { frame, result };
    },
    /** @returns {boolean} true when the message was a reply we were waiting for. */
    settle(message) {
      if (typeof message?.id !== 'number') return false; // an event, not a reply
      const waiter = pending.get(message.id);
      if (!waiter) return false;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(`CDP error ${message.error.code}: ${message.error.message}`));
      else waiter.resolve(message.result);
      return true;
    },
    /** Reject every still-outstanding request with `err` and forget it.
     *  There is no reply left to wait for once the socket that would have
     *  carried it is gone — a browser crash, a dropped connection, or
     *  close() called with a send() still awaited all end up here, so that
     *  promise rejects instead of hanging forever. A no-op when nothing is
     *  pending. */
    drain(err) {
      for (const waiter of pending.values()) waiter.reject(err);
      pending.clear();
    },
  };
}

/** Open a CDP connection.
 *  @param {string} wsUrl the webSocketDebuggerUrl from /json/version
 *  @returns {Promise<{send: (m: string, p?: object, s?: string) => Promise<any>,
 *                     on: (h: (msg: object) => void) => void,
 *                     close: () => void}>} */
export function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const dispatcher = createDispatcher();
    const listeners = [];
    let open = false;

    socket.addEventListener('message', (ev) => {
      const message = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
      if (!dispatcher.settle(message)) for (const h of listeners) h(message);
    });
    /* Before open, an error means connect() itself failed — reject the
       promise this function returns, same as before. After open, the
       promise this function returned has already resolved with a `send`
       whose caller may be awaiting a reply that will now never arrive —
       drain rejects it instead of leaving it hanging forever. */
    socket.addEventListener('error', () => {
      if (open) dispatcher.drain(new Error(`CDP: connection to ${wsUrl} errored`));
      else reject(new Error(`CDP: could not connect to ${wsUrl}`));
    });
    /* A closed socket is exactly the same situation as a post-open error:
       nothing will ever answer a pending send(), whether the browser
       crashed, the connection dropped, or the caller itself called
       close() while a send() was still awaited. Draining here is what
       makes that promise settle instead of hanging. */
    socket.addEventListener('close', () => {
      dispatcher.drain(new Error(`CDP: connection to ${wsUrl} closed`));
    });
    socket.addEventListener('open', () => {
      open = true;
      resolve({
        send(method, params, sessionId) {
          const { frame, result } = dispatcher.next(method, params, sessionId);
          socket.send(JSON.stringify(frame));
          return result;
        },
        on(handler) { listeners.push(handler); },
        close() { socket.close(); },
      });
    });
  });
}
