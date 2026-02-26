const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Backend Security", () => {
  let clientSocket;
  let clientSocket2;
  const port = 3003;

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

  test("should prevent user spoofing", async () => {
    const streamId = "stream-spoof";
    const username = "RealUser";

    const updatePromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", { streamId, username });
    await updatePromise1;

    // Join with another client so we can listen
    const updatePromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamId);
    await updatePromise2;

    const chatPromise = waitFor(clientSocket2, "chat-message");

    // Attempt to spoof "Admin"
    clientSocket.emit("chat-message", {
        streamId,
        user: "Admin", // Spoofed name
        text: "I am admin",
        color: "red"
    });

    const message = await chatPromise;
    // Current behavior: accept "Admin". Desired behavior: use "RealUser" or reject.
    // For now, let's assert the DESIRED behavior (which will fail initially)
    expect(message.user).toBe("RealUser");
  });

  test("should enforce max message length", async () => {
    const streamId = "stream-length";
    const username = "UserLength";

    const updatePromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", { streamId, username });
    await updatePromise1;

    // Join with another client so we can listen
    const updatePromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamId);
    await updatePromise2;

    const longText = "a".repeat(501);

    // We expect the message to be rejected or truncated.
    // If rejected, we won't receive it. If truncated, we receive 500 chars.
    // Let's assume we want to silently reject for now to keep it simple, or maybe just truncate.
    // The current implementation broadcasts everything.

    // Let's set up a listener that should NOT fire if we reject, or fire with truncated text.
    // But since `waitFor` waits indefinitely, we can't easily test "it didn't happen" without a timeout.

    // Let's try sending a valid message AFTER the invalid one. If the invalid one was skipped, we get the valid one first.

    const chatPromise = waitFor(clientSocket2, "chat-message");

    clientSocket.emit("chat-message", { streamId, user: username, text: longText });

    // Wait for rate limit to reset (since the invalid message might have consumed the token)
    await new Promise(r => setTimeout(r, 600));

    clientSocket.emit("chat-message", { streamId, user: username, text: "Valid" });

    const message = await chatPromise;

    // If the first message was processed, `message.text` will be longText (FAIL).
    // If the first message was rejected, `message.text` will be "Valid" (PASS).
    expect(message.text).toBe("Valid");
  });

  test("should rate limit messages", async () => {
    const streamId = "stream-rate";
    const username = "UserRate";

    const updatePromise1 = waitFor(clientSocket, "room-users-update");
    clientSocket.emit("join-stream", { streamId, username });
    await updatePromise1;

    const updatePromise2 = waitFor(clientSocket2, "room-users-update");
    clientSocket2.emit("join-stream", streamId);
    await updatePromise2;

    const messages = [];
    clientSocket2.on("chat-message", (msg) => messages.push(msg));

    // Send 3 messages rapidly
    clientSocket.emit("chat-message", { streamId, user: username, text: "1" });
    clientSocket.emit("chat-message", { streamId, user: username, text: "2" });
    clientSocket.emit("chat-message", { streamId, user: username, text: "3" });

    // Wait a bit for processing
    await new Promise(r => setTimeout(r, 100));

    // Expect only 1 message (the first one) to be received
    expect(messages.length).toBe(1);
    expect(messages[0].text).toBe("1");
  });

  test("should reject messages to unjoined rooms", async () => {
      const streamId = "stream-unjoined";

      // Client 2 joins the room to listen
      const updatePromise2 = waitFor(clientSocket2, "room-users-update");
      clientSocket2.emit("join-stream", streamId);
      await updatePromise2;

      const chatPromise = waitFor(clientSocket2, "chat-message");

      // Client 1 (not joined) sends message
      clientSocket.emit("chat-message", { streamId, user: "Stranger", text: "Hack" });

      // Send a valid message from Client 2 (who is joined) to ensure the listener resolves eventually
      clientSocket2.emit("chat-message", { streamId, user: "User2", text: "Valid" });

      const message = await chatPromise;

      // Expect the first message (Hack) to be ignored, so we receive "Valid"
      expect(message.text).toBe("Valid");
  });
});
