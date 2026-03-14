const Client = require("socket.io-client");
const jwt = require("jsonwebtoken");
const { server, io, JWT_SECRET } = require("../server");

describe("Broadcaster Multi-Session Stability & Auth Logic", () => {
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

  test("stream should stay active if one of the multiple broadcaster sessions disconnects", async () => {
    const streamId = "multi-host";
    const token = jwt.sign({ username: streamId }, JWT_SECRET);

    const host1 = new Client(`http://localhost:${port}`);
    const host2 = new Client(`http://localhost:${port}`);
    const viewer = new Client(`http://localhost:${port}`);

    try {
      // 1. Host 1 authenticates and joins
      host1.emit("register-auth", { token });
      await new Promise(r => setTimeout(r, 100)); // Wait for auth processing
      host1.emit("join-stream", { streamId, username: streamId });
      await waitFor(host1, "room-users-update");

      // 2. Host 2 authenticates and joins same stream
      host2.emit("register-auth", { token });
      await new Promise(r => setTimeout(r, 100));
      host2.emit("join-stream", { streamId, username: streamId });
      await waitFor(host2, "room-users-update");

      // 3. Viewer joins and checks if stream is active (indirectly via no stream-ended)
      viewer.emit("join-stream", streamId);
      await waitFor(viewer, "room-users-update");

      let streamEnded = false;
      viewer.on("stream-ended", () => { streamEnded = true; });

      // 4. Host 1 disconnects
      host1.disconnect();
      await new Promise(r => setTimeout(r, 200));

      // 🌉 EXPECTATION: Stream should NOT end because Host 2 is still there
      expect(streamEnded).toBe(false);

      // 5. Host 2 disconnects
      host2.disconnect();
      await new Promise(r => setTimeout(r, 200));

      // 🌉 EXPECTATION: Stream should now end
      expect(streamEnded).toBe(true);

    } finally {
      [host1, host2, viewer].forEach(s => s.connected && s.disconnect());
    }
  });

  test("unauthenticated users should not be able to start a stream", async () => {
    const streamId = "guest-host";
    const guest = new Client(`http://localhost:${port}`);
    const viewer = new Client(`http://localhost:${port}`);

    try {
      // 1. Guest joins claiming to be the host
      guest.emit("join-stream", { streamId, username: streamId });
      await waitFor(guest, "room-users-update");

      // 2. Viewer joins
      viewer.emit("join-stream", streamId);
      await waitFor(viewer, "room-users-update");

      // 3. Check if stream is active by attempting to fetch it from API
      // Or more simply, if it's NOT active, it won't be in the list
      const response = await fetch(`http://localhost:${port}/api/streams`);
      const streams = await response.json();

      const isActive = streams.some(s => s.id === streamId);
      expect(isActive).toBe(false);

    } finally {
      [guest, viewer].forEach(s => s.connected && s.disconnect());
    }
  });
});
