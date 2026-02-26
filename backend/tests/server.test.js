const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Beacon Backend", () => {
  let clientSocket;
  let clientSocket2;
  const port = 3002;

  // Helper to wait for an event
  const waitFor = (socket, event) => {
    return new Promise((resolve) => {
      socket.once(event, resolve);
    });
  };

  beforeAll((done) => {
    server.listen(port, () => {
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
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

  test("should join a stream room and update user count", async () => {
    const streamId = "stream-1";

    const updatePromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", streamId);
    await updatePromise1;

    const updatePromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamId);
    const count = await updatePromise2;

    expect(count).toBe(2);
  });

  test("should broadcast chat messages to the correct room", async () => {
    const streamId = "stream-chat";
    const username = "User1";
    const msg = { streamId, user: username, text: "Hello", color: "red" };

    const updatePromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", { streamId, username });
    await updatePromise1;

    const updatePromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamId);
    await updatePromise2;

    const chatPromise = waitFor(clientSocket2, "chat-message");
    clientSocket.emit("chat-message", msg);

    const message = await chatPromise;
    expect(message.text).toBe("Hello");
    expect(message.user).toBe("User1");
  });

  test("should not receive chat messages from other rooms", async () => {
    const streamA = "stream-A";
    const streamB = "stream-B";

    const updatePromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", streamA);
    await updatePromise1;

    const updatePromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamB);
    await updatePromise2;

    // Ensure clientSocket2 does NOT receive messages from streamA
    // We send to A, then to B. If we get A's message, it's fail.
    // If we get B's message, we assume success (since A's message was sent first).

    const chatPromise = waitFor(clientSocket2, "chat-message");

    clientSocket.emit("chat-message", { streamId: streamA, user: "U1", text: "Hi A" });
    clientSocket2.emit("chat-message", { streamId: streamB, user: "U2", text: "Hi B" });

    const message = await chatPromise;
    expect(message.text).toBe("Hi B");
  });

  test("should handle signaling (offer)", async () => {
    const payload = { target: clientSocket2.id, sdp: "mock-sdp" };

    const offerPromise = waitFor(clientSocket2, "offer");
    clientSocket.emit("offer", payload);

    const data = await offerPromise;
    expect(data.sdp).toBe("mock-sdp");
    expect(data.sender).toBe(clientSocket.id);
  });

  test("should leave stream correctly", async () => {
      const streamId = "stream-leave";

      const updatePromise1 = waitFor(clientSocket, "room-users-update");
      clientSocket.emit("join-stream", streamId);
      await updatePromise1;

      const updatePromise2 = waitFor(clientSocket2, "room-users-update");
      clientSocket2.emit("join-stream", streamId);
      const countAfterJoin = await updatePromise2;
      expect(countAfterJoin).toBe(2);

      const leaveUpdatePromise = waitFor(clientSocket2, "room-users-update");
      clientSocket.emit("leave-stream");

      const countAfterLeave = await leaveUpdatePromise;
      expect(countAfterLeave).toBe(1);
  });
});
