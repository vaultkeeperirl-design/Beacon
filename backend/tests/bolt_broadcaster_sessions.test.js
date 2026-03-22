const Client = require("socket.io-client");
const { server, io, broadcasterSessions, JWT_SECRET } = require("../server");
const jwt = require('jsonwebtoken');

describe("Bolt: Broadcaster Session Tracking Optimization", () => {
  let client1, client2, client3;
  let port;

  beforeAll((done) => {
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    if (client1 && client1.connected) client1.disconnect();
    if (client2 && client2.connected) client2.disconnect();
    if (client3 && client3.connected) client3.disconnect();
    broadcasterSessions.clear();
  });

  const createAuthenticatedClient = (username) => {
    return new Promise((resolve) => {
      const socket = new Client(`http://localhost:${port}`);
      const token = jwt.sign({ username }, JWT_SECRET);
      socket.on("connect", () => {
        socket.emit("register-auth", { token });
        // Give a moment for auth to register
        setTimeout(() => resolve(socket), 50);
      });
    });
  };

  test("should track multiple broadcaster sessions for the same stream", async () => {
    const streamId = "host123";
    client1 = await createAuthenticatedClient(streamId);
    client2 = await createAuthenticatedClient(streamId);

    // Join the stream room
    client1.emit("join-stream", { streamId, username: streamId });
    client2.emit("join-stream", { streamId, username: streamId });

    // Wait for state update
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(true);
    expect(broadcasterSessions.get(streamId).size).toBe(2);
    expect(broadcasterSessions.get(streamId).has(client1.id)).toBe(true);
    expect(broadcasterSessions.get(streamId).has(client2.id)).toBe(true);
  });

  test("should remove session on leave-stream", async () => {
    const streamId = "host123";
    client1 = await createAuthenticatedClient(streamId);
    client1.emit("join-stream", { streamId, username: streamId });

    await new Promise(r => setTimeout(r, 100));
    expect(broadcasterSessions.get(streamId).size).toBe(1);

    client1.emit("leave-stream");
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(false);
  });

  test("should remove session on disconnect", async () => {
    const streamId = "host123";
    client1 = await createAuthenticatedClient(streamId);
    client1.emit("join-stream", { streamId, username: streamId });

    await new Promise(r => setTimeout(r, 100));
    expect(broadcasterSessions.get(streamId).size).toBe(1);

    client1.disconnect();
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(false);
  });

  test("isAnotherBroadcasterActive should return true only if another host session exists", async () => {
    const { isAnotherBroadcasterActive } = require("../server");
    const streamId = "host123";

    client1 = await createAuthenticatedClient(streamId);
    client1.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    // Only one session
    expect(isAnotherBroadcasterActive(streamId, client1.id)).toBe(false);

    client2 = await createAuthenticatedClient(streamId);
    client2.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    // Two sessions
    expect(isAnotherBroadcasterActive(streamId, client1.id)).toBe(true);
    expect(isAnotherBroadcasterActive(streamId, client2.id)).toBe(true);

    // Test with a non-existent socket ID
    expect(isAnotherBroadcasterActive(streamId, "fake-id")).toBe(true);

    client2.disconnect();
    await new Promise(r => setTimeout(r, 100));

    // Back to one session
    expect(isAnotherBroadcasterActive(streamId, client1.id)).toBe(false);
  });

  test("should handle room switching", async () => {
    const streamId1 = "host1";
    const streamId2 = "host2";

    client1 = await createAuthenticatedClient(streamId1);

    // Join first room
    client1.emit("join-stream", { streamId: streamId1, username: streamId1 });
    await new Promise(r => setTimeout(r, 100));
    expect(broadcasterSessions.get(streamId1).size).toBe(1);

    // Switch to another room (not own)
    client1.emit("join-stream", { streamId: streamId2, username: streamId1 });
    await new Promise(r => setTimeout(r, 100));
    expect(broadcasterSessions.has(streamId1)).toBe(false);
    expect(broadcasterSessions.has(streamId2)).toBe(false); // Because it's not own stream
  });

  test("should clear sessions on raid", async () => {
    const streamId = "host1";
    const targetId = "target1";

    client1 = await createAuthenticatedClient(streamId);
    client2 = await createAuthenticatedClient(targetId);

    // Setup target stream
    client2.emit("join-stream", { streamId: targetId, username: targetId });
    await new Promise(r => setTimeout(r, 100));

    // Setup host stream
    client1.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));
    expect(broadcasterSessions.get(streamId).size).toBe(1);

    // Perform raid
    client1.emit("raid-stream", { streamId, targetId });
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(false);
  });
});
