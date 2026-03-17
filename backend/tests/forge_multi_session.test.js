const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const jwt = require('jsonwebtoken');

describe("Multi-Session Stability (Forge Reproduction)", () => {
  let port;
  let client1;
  let client2;

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
    if (client1) client1.close();
    if (client2) client2.close();
  });

  test("Stream should NOT end if one session disconnects but another is active", (done) => {
    const username = "hostuser";
    const token = jwt.sign({ username }, JWT_SECRET);
    const streamId = username;

    client1 = Client(`http://localhost:${port}`);

    client1.on("connect", () => {
      // 1. First session joins and authenticates
      client1.emit("register-auth", { token });
      client1.emit("join-stream", { streamId });

      setTimeout(() => {
        // 2. Second session joins and authenticates
        client2 = Client(`http://localhost:${port}`);
        client2.on("connect", () => {
          client2.emit("register-auth", { token });
          client2.emit("join-stream", { streamId });

          setTimeout(() => {
            // 3. Setup listener for stream-ended on client2
            let streamEndedReceived = false;
            client2.on("stream-ended", () => {
               streamEndedReceived = true;
            });

            // 4. Disconnect client1
            client1.disconnect();

            setTimeout(() => {
              // 5. Verify stream is still active
              const { activeStreams } = require("../server");

              expect(activeStreams.has(streamId)).toBe(true);
              expect(streamEndedReceived).toBe(false);
              done();
            }, 500);
          }, 200);
        });
      }, 200);
    });
  });
});
