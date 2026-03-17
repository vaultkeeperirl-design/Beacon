const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const jwt = require('jsonwebtoken');

describe("Poll Feature", () => {
  let hostSocket;
  let viewerSocket;
  let port;

  beforeAll((done) => {
    // Listen on port 0 to get a random available port
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

  test("should allow host to create a poll and broadcast it", (done) => {
    const streamId = "poll-stream-1";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    // Join logic
    hostSocket.emit("register-auth", { token: hostToken });
    hostSocket.emit("join-stream", { streamId, username: streamId });
    viewerSocket.emit("join-stream", { streamId, username: "viewer1" });

    // Wait for the viewer to join completely so room is established
    viewerSocket.once("room-users-update", () => {
      const question = "Best language?";
      const options = ["JS", "Python", "Rust"];

      viewerSocket.on("poll-started", (poll) => {
        try {
          expect(poll.question).toBe(question);
          expect(poll.options).toHaveLength(3);
          expect(poll.isActive).toBe(true);
          done();
        } catch (error) {
          done(error);
        }
      });

      hostSocket.emit("create-poll", { streamId, question, options });
    });
  });

  test("should allow voting and broadcast updates", (done) => {
    const streamId = "poll-stream-2";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    hostSocket.emit("register-auth", { token: hostToken });
    hostSocket.emit("join-stream", { streamId, username: streamId });
    viewerSocket.emit("join-stream", { streamId, username: "viewer1" });

    viewerSocket.once("room-users-update", () => {
      // 1. Host creates Poll
      hostSocket.emit("create-poll", {
        streamId,
        question: "Vote now",
        options: ["A", "B"]
      });

      viewerSocket.once("poll-started", (poll) => {
        const pollId = poll.id;

        // 2. Viewer votes
        // Expect update to be broadcasted
        viewerSocket.on("poll-update", (updatedPoll) => {
          try {
            if (updatedPoll.id === pollId && updatedPoll.totalVotes === 1) {
              expect(updatedPoll.options[0].votes).toBe(1);
              done();
            }
          } catch (error) {
            done(error);
          }
        });

        viewerSocket.emit("vote-poll", { streamId, pollId, optionIndex: 0 });
      });
    });
  });

  test("should sync active poll to new joiners", (done) => {
    const streamId = "poll-stream-3";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    hostSocket.emit("register-auth", { token: hostToken });
    hostSocket.emit("join-stream", { streamId, username: streamId });

    hostSocket.once("room-users-update", () => {
      // 1. Host creates poll
      hostSocket.emit("create-poll", {
        streamId,
        question: "Sync me",
        options: ["Yes", "No"]
      });

      // Join new client only after poll is created
      hostSocket.once("poll-started", () => {
        const lateSocket = new Client(`http://localhost:${port}`);

        lateSocket.on("poll-update", (poll) => {
          try {
            expect(poll.question).toBe("Sync me");
            lateSocket.disconnect();
            done();
          } catch (error) {
            lateSocket.disconnect();
            done(error);
          }
        });

        lateSocket.on("connect", () => {
           lateSocket.emit("join-stream", { streamId, username: "late" });
        });
      });
    });
  });

  test("should allow host to end poll", (done) => {
    const streamId = "poll-stream-4";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    hostSocket.emit("register-auth", { token: hostToken });
    hostSocket.emit("join-stream", { streamId, username: streamId });
    viewerSocket.emit("join-stream", { streamId, username: "viewer" });

    viewerSocket.once("room-users-update", () => {
      hostSocket.emit("create-poll", {
        streamId,
        question: "End me",
        options: ["A", "B"]
      });

      viewerSocket.once("poll-started", () => {
        viewerSocket.on("poll-ended", (poll) => {
          try {
            expect(poll.isActive).toBe(false);
            done();
          } catch (error) {
            done(error);
          }
        });

        hostSocket.emit("end-poll", { streamId });
      });
    });
  });

  test("should automatically end poll after duration", (done) => {
    const streamId = "poll-stream-5";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    hostSocket.emit("register-auth", { token: hostToken });
    hostSocket.emit("join-stream", { streamId, username: streamId });
    viewerSocket.emit("join-stream", { streamId, username: "viewer" });

    viewerSocket.once("room-users-update", () => {
      hostSocket.emit("create-poll", {
        streamId,
        question: "Auto End?",
        options: ["Yes", "No"],
        duration: 0.1 // 100ms
      });

      viewerSocket.once("poll-started", () => {
        viewerSocket.on("poll-ended", (poll) => {
          try {
            expect(poll.isActive).toBe(false);
            expect(poll.question).toBe("Auto End?");
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});
