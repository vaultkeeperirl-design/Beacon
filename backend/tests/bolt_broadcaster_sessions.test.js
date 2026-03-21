const Client = require("socket.io-client");
const { server, io, broadcasterSessions, updateBroadcasterSession, isAnotherBroadcasterActive, JWT_SECRET } = require("../server");
const jwt = require("jsonwebtoken");

describe("⚡ Bolt: Broadcaster Sessions Performance Optimization", () => {
  let port;
  let clientSocket;
  let clientSocket2;
  const streamId = "test-stream";
  const token = jwt.sign({ username: streamId }, JWT_SECRET);

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
    let count = 0;
    const checkDone = () => { if (++count === 2) done(); };
    clientSocket.on("connect", checkDone);
    clientSocket2.on("connect", checkDone);
  });

  afterEach(() => {
    clientSocket.disconnect();
    clientSocket2.disconnect();
    broadcasterSessions.clear();
  });

  test("should track authenticated broadcaster sessions on join-stream", (done) => {
    clientSocket.emit("register-auth", { token });

    // Wait for auth to process
    setTimeout(() => {
      clientSocket.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        expect(broadcasterSessions.has(streamId)).toBe(true);
        expect(broadcasterSessions.get(streamId).has(clientSocket.id)).toBe(true);
        expect(isAnotherBroadcasterActive(streamId, "some-other-id")).toBe(true);
        expect(isAnotherBroadcasterActive(streamId, clientSocket.id)).toBe(false);
        done();
      }, 100);
    }, 100);
  });

  test("should track multiple broadcaster sessions for the same streamId", (done) => {
    clientSocket.emit("register-auth", { token });
    clientSocket2.emit("register-auth", { token });

    setTimeout(() => {
      clientSocket.emit("join-stream", { streamId, username: streamId });
      clientSocket2.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        expect(broadcasterSessions.get(streamId).size).toBe(2);
        expect(isAnotherBroadcasterActive(streamId, clientSocket.id)).toBe(true);
        expect(isAnotherBroadcasterActive(streamId, clientSocket2.id)).toBe(true);
        done();
      }, 100);
    }, 100);
  });

  test("should clean up session on leave-stream", (done) => {
    clientSocket.emit("register-auth", { token });

    setTimeout(() => {
      clientSocket.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        expect(broadcasterSessions.get(streamId).size).toBe(1);
        clientSocket.emit("leave-stream");

        setTimeout(() => {
          expect(broadcasterSessions.has(streamId)).toBe(false);
          expect(isAnotherBroadcasterActive(streamId, "any")).toBe(false);
          done();
        }, 100);
      }, 100);
    }, 100);
  });

  test("should clean up session on disconnect", (done) => {
    clientSocket.emit("register-auth", { token });

    setTimeout(() => {
      clientSocket.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        expect(broadcasterSessions.get(streamId).size).toBe(1);
        clientSocket.disconnect();

        setTimeout(() => {
          expect(broadcasterSessions.has(streamId)).toBe(false);
          done();
        }, 100);
      }, 100);
    }, 100);
  });

  test("should track session if authenticated AFTER join-stream", (done) => {
    clientSocket.emit("join-stream", { streamId, username: streamId });

    setTimeout(() => {
      // Not authenticated yet, so no session
      expect(broadcasterSessions.has(streamId)).toBe(false);

      clientSocket.emit("register-auth", { token });

      setTimeout(() => {
        expect(broadcasterSessions.has(streamId)).toBe(true);
        expect(broadcasterSessions.get(streamId).has(clientSocket.id)).toBe(true);
        done();
      }, 100);
    }, 100);
  });

  test("should clean up session when switching rooms via join-stream", (done) => {
    const streamId2 = "test-stream-2";
    clientSocket.emit("register-auth", { token });

    setTimeout(() => {
      clientSocket.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        expect(broadcasterSessions.get(streamId).size).toBe(1);

        // Join another stream (not as broadcaster for the new one)
        clientSocket.emit("join-stream", { streamId: streamId2, username: streamId });

        setTimeout(() => {
          expect(broadcasterSessions.has(streamId)).toBe(false);
          done();
        }, 100);
      }, 100);
    }, 100);
  });
});
