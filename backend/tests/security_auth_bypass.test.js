const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Authorization Bypass Reproduction", () => {
  let port;
  let clientSocketHost, clientSocketViewer;

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
    if (clientSocketHost && clientSocketHost.connected) clientSocketHost.disconnect();
    if (clientSocketViewer && clientSocketViewer.connected) clientSocketViewer.disconnect();
  });

  test("Should prevent second user from claiming host username if stream is active", async () => {
    const streamId = "host_user_123";

    clientSocketHost = Client(`http://localhost:${port}`);
    await new Promise(r => clientSocketHost.on("connect", r));

    clientSocketHost.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    clientSocketViewer = Client(`http://localhost:${port}`);
    await new Promise(r => clientSocketViewer.on("connect", r));

    clientSocketViewer.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    // Malicious Viewer tries to create a poll
    clientSocketViewer.emit("create-poll", {
      streamId,
      question: "Am I the new host?",
      options: ["Yes", "No"]
    });

    let pollStarted = false;
    clientSocketHost.on("poll-started", () => pollStarted = true);
    clientSocketViewer.on("poll-started", () => pollStarted = true);

    await new Promise(r => setTimeout(r, 200));
    expect(pollStarted).toBe(false);
  });

  test("Should allow legitimate host to rejoin and claim host username", async () => {
    const streamId = "rejoining_host_stream";

    clientSocketHost = Client(`http://localhost:${port}`);
    await new Promise(r => clientSocketHost.on("connect", r));

    clientSocketHost.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    clientSocketHost.disconnect();
    await new Promise(r => setTimeout(r, 100));

    clientSocketHost = Client(`http://localhost:${port}`);
    await new Promise(r => clientSocketHost.on("connect", r));

    clientSocketHost.emit("join-stream", { streamId, username: streamId });
    await new Promise(r => setTimeout(r, 100));

    clientSocketHost.emit("create-poll", {
        streamId,
        question: "Am I back?",
        options: ["Yes", "No"]
    });

    const poll = await new Promise((resolve) => {
       clientSocketHost.on("poll-started", resolve);
       setTimeout(() => resolve(null), 1000);
    });

    expect(poll).not.toBeNull();
    expect(poll.question).toBe("Am I back?");
  });
});
