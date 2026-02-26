const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Bug Reproduction: socket.currentRoom desync", () => {
  let clientSocket;
  let clientSocket2;
  let port;

  // Helper to wait for an event
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
    clientSocket = new Client(`http://localhost:${port}`);
    clientSocket2 = new Client(`http://localhost:${port}`);

    let connectedCount = 0;
    const onConnect = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    clientSocket.on("connect", onConnect);
    clientSocket2.on("connect", onConnect);
  });

  afterEach(() => {
    if (clientSocket.connected) clientSocket.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  test("should fail to rejoin room after invalid join attempt", async () => {
    const streamId = "bug-repro-room";

    // 1. Join room
    const joinPromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", streamId);
    await joinPromise1;

    // 2. Invalid join (null) - triggers leave but fails to clear currentRoom
    // We can't easily wait for an event here because the server doesn't emit one specifically for the error case,
    // but it does emit 'room-users-update' to the OLD room (streamId) because it left.
    const leavePromise = waitFor(clientSocket, "room-users-update");
    // Wait, clientSocket just left the room, so it might NOT receive room-users-update if it's sent to the room.
    // server.js: io.to(prevRoom).emit('room-users-update', prevCount);
    // If clientSocket left, it won't get this.

    // However, we can sleep a bit to ensure server processed it.
    clientSocket.emit("join-stream", null);
    await new Promise(r => setTimeout(r, 100));

    // 3. Re-join same room
    // If bug exists, server thinks we are already in 'bug-repro-room' and does nothing.
    clientSocket.emit("join-stream", streamId);
    await new Promise(r => setTimeout(r, 100));

    // 4. Verify by having another user join and check count
    const joinPromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamId);
    const count = await joinPromise2;

    // If bug exists, count will be 1 (only clientSocket2).
    // If fixed, count should be 2.
    expect(count).toBe(2);
  });

  test("should update activeStreams when re-joining as host", async () => {
    const streamId = "host-transition-room";
    const username = streamId; // Host username equals streamId

    // 1. Join as anonymous viewer
    clientSocket.emit("join-stream", streamId);
    await waitFor(clientSocket, "room-users-update");

    // 2. Re-join as host (same streamId, but providing username)
    const updatePromise = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", { streamId, username });
    await updatePromise;

    // 3. Verify stream is active by checking if viewers are redirected on disconnect
    // (A bit indirect to test activeStreams set, but effective)

    // Join a viewer
    clientSocket2.emit("join-stream", streamId);
    await waitFor(clientSocket2, "room-users-update");

    const endedPromise = waitFor(clientSocket2, "stream-ended");
    clientSocket.disconnect(); // Host disconnects

    await endedPromise; // Should be called if stream was in activeStreams
  });
});
