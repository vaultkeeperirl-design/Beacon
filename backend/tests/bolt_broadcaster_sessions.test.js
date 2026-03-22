const Client = require("socket.io-client");
const { server, io, broadcasterSessions, JWT_SECRET, activeStreams } = require("../server");
const jwt = require("jsonwebtoken");

describe("Broadcaster Session Logic", () => {
  let port;
  let streamerToken;
  const streamId = "test-streamer";

  beforeAll((done) => {
    streamerToken = jwt.sign({ username: streamId }, JWT_SECRET);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  const createAuthenticatedClient = (token) => {
    return new Promise((resolve) => {
      const socket = new Client(`http://localhost:${port}`);
      socket.on("connect", () => {
        socket.emit("register-auth", { token });
        // Give some time for auth processing
        setTimeout(() => resolve(socket), 100);
      });
    });
  };

  test("Should track authenticated broadcaster sessions in O(1) Map", async () => {
    const socket1 = await createAuthenticatedClient(streamerToken);

    // Join stream
    socket1.emit("join-stream", { streamId });
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(true);
    expect(broadcasterSessions.get(streamId).has(socket1.id)).toBe(true);
    expect(activeStreams.has(streamId)).toBe(true);

    // Add second session (multi-tab)
    const socket2 = await createAuthenticatedClient(streamerToken);
    socket2.emit("join-stream", { streamId });
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.get(streamId).size).toBe(2);
    expect(broadcasterSessions.get(streamId).has(socket2.id)).toBe(true);

    // Disconnect one session
    socket1.disconnect();
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.get(streamId).size).toBe(1);
    expect(activeStreams.has(streamId)).toBe(true); // Stream should stay active

    // Disconnect last session
    socket2.disconnect();
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(false);
    expect(activeStreams.has(streamId)).toBe(false); // Stream should be deleted
  });

  test("Should activate stream if authenticating while already in room", async () => {
    const socket = new Client(`http://localhost:${port}`);
    await new Promise(r => {
      socket.on("connect", r);
    });

    // Join as guest first
    socket.emit("join-stream", { streamId });
    await new Promise(r => setTimeout(r, 100));

    expect(activeStreams.has(streamId)).toBe(false);

    // Now authenticate
    socket.emit("register-auth", { token: streamerToken });
    await new Promise(r => setTimeout(r, 100));

    expect(broadcasterSessions.has(streamId)).toBe(true);
    expect(activeStreams.has(streamId)).toBe(true);

    socket.disconnect();
  });

  test("Should protect host identity from spoofing", async () => {
    const hostSocket = await createAuthenticatedClient(streamerToken);
    hostSocket.emit("join-stream", { streamId });
    await new Promise(r => setTimeout(r, 100));

    const viewerSocket = new Client(`http://localhost:${port}`);
    await new Promise(r => {
      viewerSocket.on("connect", r);
    });

    // Try to join claiming to be host
    viewerSocket.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    // Map should only contain the authenticated socket
    expect(broadcasterSessions.get(streamId).size).toBe(1);
    expect(broadcasterSessions.get(streamId).has(hostSocket.id)).toBe(true);
    expect(broadcasterSessions.get(streamId).has(viewerSocket.id)).toBe(false);

    hostSocket.disconnect();
    viewerSocket.disconnect();
  });
});
