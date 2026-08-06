export function createDispatcher() {
  let id = 0;
  const pending = new Map();

  return {
    pending,
    next(method, params = {}, sessionId?) {
      const frame: { id: number; method: any; params: any; sessionId?: string } =
        { id: ++id, method, params };
      if (sessionId) frame.sessionId = sessionId;
      const result = new Promise((resolve, reject) => pending.set(frame.id, { resolve, reject }));
      return { frame, result };
    },

    settle(message) {
      if (typeof message?.id !== 'number') return false;
      const waiter = pending.get(message.id);
      if (!waiter) return false;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(`CDP error ${message.error.code}: ${message.error.message}`));
      else waiter.resolve(message.result);
      return true;
    },

    drain(err) {
      for (const waiter of pending.values()) waiter.reject(err);
      pending.clear();
    },
  };
}

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

    socket.addEventListener('error', () => {
      if (open) dispatcher.drain(new Error(`CDP: connection to ${wsUrl} errored`));
      else reject(new Error(`CDP: could not connect to ${wsUrl}`));
    });

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
