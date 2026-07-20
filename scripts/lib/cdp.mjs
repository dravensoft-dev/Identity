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

    socket.addEventListener('message', (ev) => {
      const message = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
      if (!dispatcher.settle(message)) for (const h of listeners) h(message);
    });
    socket.addEventListener('error', () => reject(new Error(`CDP: could not connect to ${wsUrl}`)));
    socket.addEventListener('open', () => {
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
