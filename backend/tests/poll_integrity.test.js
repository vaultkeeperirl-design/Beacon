const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Poll Integrity and Security", () => {
  let hostSocket;
  let viewerSocket;
  let port;

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
    hostSocket = new Client(`http://localhost:${port}`);
    viewerSocket = new Client(`http://localhost:${port}`);

    let connectedCount = 0;
    const onConnect = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    hostSocket.on("connect", onConnect);
    viewerSocket.on("connect", onConnect);
  });

  afterEach(() => {
    if (hostSocket.connected) hostSocket.disconnect();
    if (viewerSocket.connected) viewerSocket.disconnect();
  });

  test("should NOT leak internal poll state (voters, timeoutId) to new joiners", (done) => {
    const streamId = "leak-test-stream";
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../server');
    const token = jwt.sign({ username: streamId }, JWT_SECRET);

    console.log("Test 1: Authenticating host");
    hostSocket.emit("register-auth", { token });

    console.log("Test 1: Joining as host");
    hostSocket.emit("join-stream", { streamId, username: streamId });

    setTimeout(() => {
      console.log("Test 1: Creating poll");
      hostSocket.emit("create-poll", {
        streamId,
        question: "Leak Test",
        options: ["Yes", "No"],
        duration: 60
      });

      setTimeout(() => {
        console.log("Test 1: Joining as late user");
        const lateSocket = new Client(`http://localhost:${port}`);
        lateSocket.on("connect", () => {
          console.log("Test 1: Late user connected");

          lateSocket.on("poll-update", (poll) => {
            console.log("Test 1: Received poll-update", poll);
            try {
              // Internal properties like voters and timeoutId must be sanitized
              expect(poll.voters).toBeUndefined();
              expect(poll.timeoutId).toBeUndefined();
              lateSocket.disconnect();
              done();
            } catch (error) {
              lateSocket.disconnect();
              done(error);
            }
          });

          console.log("Test 1: Emitting join-stream for late-user");
          lateSocket.emit("join-stream", { streamId, username: "late-user" });
        });
      }, 200);
    }, 100);
  });

  test("should prevent double voting by the same user across different socket sessions", (done) => {
    const streamId = "multi-session-vote-test";
    const username = "persistent-user";
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../server');
    const token = jwt.sign({ username: streamId }, JWT_SECRET);

    console.log("Test 2: Authenticating host");
    hostSocket.emit("register-auth", { token });

    console.log("Test 2: Joining as host");
    hostSocket.emit("join-stream", { streamId, username: streamId });

    setTimeout(() => {
      console.log("Test 2: Creating poll");
      hostSocket.emit("create-poll", {
        streamId,
        question: "Vote once?",
        options: ["A", "B"]
      });

      hostSocket.once("poll-started", (poll) => {
        const pollId = poll.id;
        console.log("Test 2: Poll started", pollId);

        // First session: Vote
        console.log("Test 2: First session join and vote");
        viewerSocket.emit("join-stream", { streamId, username });
        viewerSocket.emit("vote-poll", { streamId, pollId, optionIndex: 0 });

        // Wait for first vote to be processed
        setTimeout(() => {
          // Verify first vote counted
          console.log("Test 2: Verifying first vote");
          // We can join a new user to get the current poll state
          const verifier1 = new Client(`http://localhost:${port}`);
          verifier1.on("connect", () => {
            verifier1.on("poll-update", (p1) => {
              console.log("Test 2: First vote count:", p1.totalVotes);
              expect(p1.totalVotes).toBe(1);
              verifier1.disconnect();

              // Disconnect first session
              viewerSocket.disconnect();

              setTimeout(() => {
                // Second session: New socket, same username
                console.log("Test 2: Second session join and vote");
                const viewerSocket2 = new Client(`http://localhost:${port}`);
                viewerSocket2.on("connect", () => {
                  viewerSocket2.emit("join-stream", { streamId, username });

                  setTimeout(() => {
                    viewerSocket2.emit("vote-poll", { streamId, pollId, optionIndex: 1 });

                    setTimeout(() => {
                      const checkerSocket = new Client(`http://localhost:${port}`);
                      checkerSocket.on("connect", () => {
                        checkerSocket.on("poll-update", (finalPoll) => {
                          console.log("Test 2: Final vote count:", finalPoll.totalVotes);
                          try {
                            // If fixed, totalVotes should still be 1 (second vote ignored)
                            // because we use persistent username for vote tracking.
                            expect(finalPoll.totalVotes).toBe(1);
                            viewerSocket2.disconnect();
                            checkerSocket.disconnect();
                            done();
                          } catch (error) {
                            viewerSocket2.disconnect();
                            checkerSocket.disconnect();
                            done(error);
                          }
                        });
                        checkerSocket.emit("join-stream", { streamId, username: "checker" });
                      });
                    }, 200);
                  }, 100);
                });
              }, 200);
            });
            verifier1.emit("join-stream", { streamId, username: "verifier1" });
          });
        }, 200);
      });
    }, 100);
  });
});
