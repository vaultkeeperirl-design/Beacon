const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const jwt = require("jsonwebtoken");

describe("Broadcaster Multi-Session and Stability", () => {
  let port;
  let hostSocket1, hostSocket2, viewerSocket;

  beforeAll((done) => {
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    if (hostSocket1 && hostSocket1.connected) hostSocket1.disconnect();
    if (hostSocket2 && hostSocket2.connected) hostSocket2.disconnect();
    if (viewerSocket && viewerSocket.connected) viewerSocket.disconnect();
  });

  test("Stream should persist if one of two host sessions disconnects", (done) => {
    const streamId = "multi-session-host";
    const token = jwt.sign({ username: streamId }, JWT_SECRET);

    hostSocket1 = new Client(`http://localhost:${port}`);
    hostSocket2 = new Client(`http://localhost:${port}`);
    viewerSocket = new Client(`http://localhost:${port}`);

    let streamEndedReceived = false;
    viewerSocket.on("stream-ended", () => {
      streamEndedReceived = true;
    });

    // 1. First host session joins
    hostSocket1.emit("register-auth", { token });
    hostSocket1.emit("join-stream", { streamId, username: streamId });

    setTimeout(() => {
      // 2. Second host session joins
      hostSocket2.emit("register-auth", { token });
      hostSocket2.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        // 3. Viewer joins
        viewerSocket.emit("join-stream", { streamId, username: "viewer" });

        setTimeout(() => {
          // 4. First host session disconnects
          hostSocket1.disconnect();

          setTimeout(() => {
            // 5. Verify stream is still active (viewer didn't receive stream-ended)
            try {
              expect(streamEndedReceived).toBe(false);

              // 6. Final session leaves
              hostSocket2.disconnect();

              setTimeout(() => {
                expect(streamEndedReceived).toBe(true);
                done();
              }, 200);
            } catch (error) {
              done(error);
            }
          }, 200);
        }, 200);
      }, 200);
    }, 200);
  });

  test("Identity protection: Unauthenticated user cannot impersonate host and end stream", (done) => {
    const streamId = "protected-host";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    hostSocket1 = new Client(`http://localhost:${port}`);
    const attackerSocket = new Client(`http://localhost:${port}`);
    viewerSocket = new Client(`http://localhost:${port}`);

    let streamEndedReceived = false;
    viewerSocket.on("stream-ended", () => {
      streamEndedReceived = true;
    });

    // 1. Real host joins
    hostSocket1.emit("register-auth", { token: hostToken });
    hostSocket1.emit("join-stream", { streamId, username: streamId });

    setTimeout(() => {
      // 2. Attacker joins (unauthenticated, claiming to be host)
      attackerSocket.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        // 3. Viewer joins
        viewerSocket.emit("join-stream", { streamId, username: "viewer" });

        setTimeout(() => {
          // 4. Attacker leaves
          attackerSocket.disconnect();

          setTimeout(() => {
            // 5. Stream should NOT have ended
            try {
              expect(streamEndedReceived).toBe(false);
              attackerSocket.close();
              done();
            } catch (error) {
              attackerSocket.close();
              done(error);
            }
          }, 200);
        }, 200);
      }, 200);
    }, 200);
  });
});
