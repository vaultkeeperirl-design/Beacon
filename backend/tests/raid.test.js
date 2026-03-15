const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const jwt = require('jsonwebtoken');

describe("Raid Functionality", () => {
  let hostSocket;
  let viewerSocket;
  let port;

  const waitFor = (socket, event) => {
    return new Promise((resolve) => {
      socket.once(event, resolve);
    });
  };

  beforeAll((done) => {
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(() => {
      done();
    });
  });

  beforeEach((done) => {
    hostSocket = new Client(`http://localhost:${port}`);
    viewerSocket = new Client(`http://localhost:${port}`);

    let connectedCount = 0;
    const onConnect = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    hostSocket.on("connect", onConnect);
    viewerSocket.on("connect", onConnect);
  });

  afterEach(() => {
    if (hostSocket.connected) hostSocket.disconnect();
    if (viewerSocket.connected) viewerSocket.disconnect();
  });

  test("should redirect viewers when host triggers a raid", async () => {
    const streamId = "host-user";
    const targetId = "target-user";

    // 0. Host authenticates
    const token = jwt.sign({ username: streamId }, JWT_SECRET);
    hostSocket.emit("register-auth", { token });
    await new Promise(r => setTimeout(r, 100));

    // Host joins and becomes the streamer
    hostSocket.emit("join-stream", { streamId, username: streamId });
    await waitFor(hostSocket, "room-users-update");

    // Viewer joins the same stream
    viewerSocket.emit("join-stream", { streamId, username: "viewer-1" });
    await waitFor(viewerSocket, "room-users-update");

    // Host triggers raid
    const raidPromise = waitFor(viewerSocket, "stream-ended");
    hostSocket.emit("raid-stream", { streamId, targetId });

    const data = await raidPromise;
    expect(data.redirect).toBe(targetId);
  });

  test("should not allow non-host to trigger a raid", async () => {
    const streamId = "real-host";
    const targetId = "target-user";

    // Host joins
    hostSocket.emit("join-stream", { streamId, username: streamId });
    await waitFor(hostSocket, "room-users-update");

    // Malicious viewer joins
    viewerSocket.emit("join-stream", { streamId, username: "malicious-viewer" });
    await waitFor(viewerSocket, "room-users-update");

    // Viewer tries to raid
    // We expect NO stream-ended event to be received by the host
    let receivedRaid = false;
    hostSocket.on("stream-ended", () => {
        receivedRaid = true;
    });

    viewerSocket.emit("raid-stream", { streamId, targetId });

    // Wait a bit to ensure no event is received
    await new Promise(r => setTimeout(r, 200));
    expect(receivedRaid).toBe(false);
  });
});
