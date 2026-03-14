const { io: createClient } = require("socket.io-client");

const waitForEvent = (socket, eventName, predicate = null, timeoutMs = 5000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    const onEvent = (payload) => {
      if (predicate && !predicate(payload)) {
        return;
      }

      clearTimeout(timer);
      socket.off(eventName, onEvent);
      resolve(payload);
    };

    socket.on(eventName, onEvent);
  });

const connectSocket = async ({ baseUrl, token }) => {
  const socket = createClient(baseUrl, {
    auth: token ? { token } : undefined,
    transports: ["websocket"],
    forceNew: true,
    reconnection: false
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out connecting socket"));
    }, 5000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  return socket;
};

const disconnectSockets = async (...sockets) => {
  sockets
    .filter(Boolean)
    .forEach((socket) => {
      if (socket.connected) {
        socket.disconnect();
      }
    });

  await new Promise((resolve) => setTimeout(resolve, 50));
};

module.exports = {
  connectSocket,
  disconnectSockets,
  waitForEvent
};
