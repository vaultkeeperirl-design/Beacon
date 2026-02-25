const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Beacon Backend", () => {
  let clientSocket;
  let clientSocket2;
  const port = 3002;

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
    clientSocket.on("connect", () => {
       clientSocket2 = new Client(`http://localhost:${port}`);
       clientSocket2.on("connect", done);
    });
  });

  afterEach(() => {
    if (clientSocket.connected) clientSocket.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  test("should join a stream room and update user count", (done) => {
    const streamId = "stream-1";

    clientSocket.emit("join-stream", streamId);

    // Allow time for clientSocket to join so clientSocket2 sees count 2 upon joining
    setTimeout(() => {
        clientSocket2.emit("join-stream", streamId);
    }, 50);

    clientSocket2.on("room-users-update", (count) => {
        if (count === 2) {
            done();
        }
    });
  });

  test("should broadcast chat messages to the correct room", (done) => {
    const streamId = "stream-chat";
    const msg = { streamId, user: "User1", text: "Hello", color: "red" };

    clientSocket.emit("join-stream", streamId);
    clientSocket2.emit("join-stream", streamId);

    setTimeout(() => {
        clientSocket2.on("chat-message", (message) => {
            try {
                expect(message.text).toBe("Hello");
                expect(message.user).toBe("User1");
                done();
            } catch (e) {
                done(e);
            }
        });

        clientSocket.emit("chat-message", msg);
    }, 200);
  });

  test("should not receive chat messages from other rooms", (done) => {
    const streamA = "stream-A";
    const streamB = "stream-B";

    clientSocket.emit("join-stream", streamA);
    clientSocket2.emit("join-stream", streamB);

    clientSocket2.on("chat-message", () => {
        done(new Error("Received message from wrong room"));
    });

    setTimeout(() => {
        clientSocket.emit("chat-message", { streamId: streamA, user: "U1", text: "Hi A" });
        setTimeout(done, 500);
    }, 200);
  });

  test("should handle signaling (offer)", (done) => {
    const payload = { target: clientSocket2.id, sdp: "mock-sdp" };

    clientSocket2.on("offer", (data) => {
        try {
            expect(data.sdp).toBe("mock-sdp");
            expect(data.sender).toBe(clientSocket.id);
            done();
        } catch (e) {
            done(e);
        }
    });

    clientSocket.emit("offer", payload);
  });

  test("should leave stream correctly", (done) => {
      const streamId = "stream-leave";
      // Ensure clientSocket joins first
      clientSocket.emit("join-stream", streamId);

      setTimeout(() => {
          clientSocket2.emit("join-stream", streamId);
      }, 50);

      clientSocket2.on("room-users-update", (count) => {
          if (count === 2) {
              // Both present, now clientSocket leaves
              clientSocket.emit("leave-stream");
          } else if (count === 1) {
              done();
          }
      });
  });
});
