const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Raid Notification Functionality", () => {
  let hostSocket;
  let targetSocket;
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
    targetSocket = new Client(`http://localhost:${port}`);
    viewerSocket = new Client(`http://localhost:${port}`);

    let connectedCount = 0;
    const onConnect = () => {
      connectedCount++;
      if (connectedCount === 3) done();
    };

    hostSocket.on("connect", onConnect);
    targetSocket.on("connect", onConnect);
    viewerSocket.on("connect", onConnect);
  });

  afterEach(() => {
    if (hostSocket.connected) hostSocket.disconnect();
    if (targetSocket.connected) targetSocket.disconnect();
    if (viewerSocket.connected) viewerSocket.disconnect();
  });

  test("should notify target stream when a raid occurs", async () => {
    const hostId = "raider-user";
    const targetId = "target-user";

    // Target joins and becomes an active streamer
    targetSocket.emit("join-stream", { streamId: targetId, username: targetId });
    await waitFor(targetSocket, "room-users-update");

    // Host joins and becomes an active streamer
    hostSocket.emit("join-stream", { streamId: hostId, username: hostId });
    await waitFor(hostSocket, "room-users-update");

    // Viewer joins host's stream
    viewerSocket.emit("join-stream", { streamId: hostId, username: "viewer-1" });
    await waitFor(viewerSocket, "room-users-update");

    // Setup listener for target chat
    const chatPromise = new Promise((resolve) => {
      targetSocket.on("chat-message", (msg) => {
        if (msg.user === "System" && msg.text.includes("is raiding")) {
          resolve(msg);
        }
      });
    });

    // Host triggers raid
    hostSocket.emit("raid-stream", { streamId: hostId, targetId: targetId });

    const raidMsg = await chatPromise;
    expect(raidMsg.text).toContain(hostId);
    expect(raidMsg.text).toContain("is raiding");
    // We expect 2 viewers (host + viewer) or maybe just viewers excluding host?
    // The current logic in server.js uses room size.
    // Host + Viewer = 2.
    expect(raidMsg.text).toContain("2 viewers");
  });
});
