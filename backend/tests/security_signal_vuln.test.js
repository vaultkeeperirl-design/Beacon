const { server, io } = require("../server");
const Client = require("socket.io-client");

describe("Signaling Security - Generic Signal Event", () => {
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

  test("should prevent cross-room signaling via generic 'signal' event", async () => {
    const streamA = "stream-A";
    const streamB = "stream-B";

    // Client 1 joins Stream A
    clientSocket.emit("join-stream", streamA);
    await waitFor(clientSocket, "room-users-update");

    // Client 2 joins Stream B
    clientSocket2.emit("join-stream", streamB);
    await waitFor(clientSocket2, "room-users-update");

    let receivedSignal = false;
    clientSocket2.on("signal", () => {
        receivedSignal = true;
    });

    // Client 1 attempts to signal Client 2 across rooms using the generic 'signal' event
    clientSocket.emit("signal", {
        to: clientSocket2.id,
        signal: { type: "offer", sdp: "malicious-sdp" }
    });

    // Wait a bit to see if signal arrives
    await new Promise(r => setTimeout(r, 200));

    // Currently, this should FAIL (receivedSignal will be true) because the server lacks validation
    expect(receivedSignal).toBe(false);
  });

  test("should allow signaling within the same room via generic 'signal' event", async () => {
    const streamA = "stream-A";

    // Both clients join Stream A
    clientSocket.emit("join-stream", streamA);
    await waitFor(clientSocket, "room-users-update");

    clientSocket2.emit("join-stream", streamA);
    await waitFor(clientSocket2, "room-users-update");

    const signalPromise = waitFor(clientSocket2, "signal");

    // Client 1 signals Client 2 in the same room
    clientSocket.emit("signal", {
        to: clientSocket2.id,
        signal: { type: "offer", sdp: "valid-sdp" }
    });

    const received = await signalPromise;
    expect(received.signal.sdp).toBe("valid-sdp");
    expect(received.from).toBe(clientSocket.id);
  });
});
