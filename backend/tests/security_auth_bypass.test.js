const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Backend Auth Bypass", () => {
  let hostSocket;
  let attackerSocket;
  let viewerSocket;
  let port;

  const waitFor = (socket, event) => new Promise(resolve => socket.once(event, resolve));

  beforeAll((done) => {
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(() => done());
  });

  beforeEach((done) => {
    hostSocket = new Client(`http://localhost:${port}`);
    attackerSocket = new Client(`http://localhost:${port}`);
    viewerSocket = new Client(`http://localhost:${port}`);

    let count = 0;
    const onConnect = () => { count++; if (count === 3) done(); };

    hostSocket.on("connect", onConnect);
    attackerSocket.on("connect", onConnect);
    viewerSocket.on("connect", onConnect);
  });

  afterEach(() => {
    [hostSocket, attackerSocket, viewerSocket].forEach(s => s.connected && s.disconnect());
  });

  test("attacker should not be able to end stream by impersonating host", async () => {
    const streamId = "real-host";

    // Host joins
    hostSocket.emit("join-stream", { streamId, username: streamId });
    await waitFor(hostSocket, "room-users-update");

    // Viewer joins
    viewerSocket.emit("join-stream", { streamId, username: "innocent-viewer" });
    await waitFor(viewerSocket, "room-users-update");

    let streamEnded = false;
    viewerSocket.on("stream-ended", () => { streamEnded = true; });

    // Attacker joins impersonating host
    attackerSocket.emit("join-stream", { streamId, username: streamId });
    await waitFor(attackerSocket, "room-users-update");

    // Attacker leaves
    attackerSocket.emit("leave-stream");

    await new Promise(r => setTimeout(r, 200));

    // If stream ended because attacker left, that's a vulnerability!
    expect(streamEnded).toBe(false);
  });
});
