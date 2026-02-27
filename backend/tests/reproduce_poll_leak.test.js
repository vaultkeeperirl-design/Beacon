const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Poll Leak Reproduction", () => {
  let port;
  let clientSocketHost, clientSocketViewer1, clientSocketViewer2;

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
    if (clientSocketHost) clientSocketHost.close();
    if (clientSocketViewer1) clientSocketViewer1.close();
    if (clientSocketViewer2) clientSocketViewer2.close();
  });

  test("Poll should be removed when host leaves", (done) => {
    const streamId = "host_user_123";

    // 1. Host Connects
    clientSocketHost = Client(`http://localhost:${port}`);
    clientSocketHost.on("connect", () => {
      clientSocketHost.emit("join-stream", { streamId, username: streamId });

      // 2. Host Creates Poll immediately after joining
      clientSocketHost.emit("create-poll", {
        streamId,
        question: "Is this a bug?",
        options: ["Yes", "No"]
      });
    });

    // 3. Viewer 1 joins after a slight delay to ensure poll is created
    setTimeout(() => {
        clientSocketViewer1 = Client(`http://localhost:${port}`);
        clientSocketViewer1.on("connect", () => {
          clientSocketViewer1.emit("join-stream", { streamId, username: "viewer1" });
        });

        // When joining an existing stream with a poll, we expect 'poll-update'
        // because of: socket.emit('poll-update', activePolls.get(streamId));
        clientSocketViewer1.on("poll-update", (poll) => {
          try {
            // Verify we got the poll
            expect(poll.question).toBe("Is this a bug?");

            // 4. Host Disconnects
            clientSocketHost.disconnect();

            // Wait for server to process disconnect and cleanup (or fail to cleanup)
            setTimeout(() => {
              // 5. Viewer 2 joins
              clientSocketViewer2 = Client(`http://localhost:${port}`);

              let pollReceived = false;
              clientSocketViewer2.on("connect", () => {
                 clientSocketViewer2.emit("join-stream", { streamId, username: "viewer2" });
              });

              // If the bug exists, this will fire
              clientSocketViewer2.on("poll-update", (p) => {
                 pollReceived = true;
              });

              // Wait to see if we get the poll
              setTimeout(() => {
                // BUG FIXED:
                // Expected behavior: pollReceived is false (poll is cleared)
                expect(pollReceived).toBe(false);
                done();
              }, 500);
            }, 500);

          } catch (error) {
            done(error);
          }
        });
    }, 200);
  }, 10000); // 10s timeout
});
