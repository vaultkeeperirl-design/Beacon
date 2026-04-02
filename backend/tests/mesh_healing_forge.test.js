const { server, io, streamMeshTopology, JWT_SECRET } = require("../server");
const Client = require("socket.io-client");
const jwt = require("jsonwebtoken");

describe("Mesh Network Healing and Retroactive Host Promotion", () => {
  let port;
  let broadcaster, viewer1, viewer2, viewer3;

  beforeAll((done) => {
    if (!server.listening) {
      server.listen(0, () => {
        port = server.address().port;
        done();
      });
    } else {
      port = server.address().port;
      done();
    }
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    if (broadcaster && broadcaster.connected) broadcaster.disconnect();
    if (viewer1 && viewer1.connected) viewer1.disconnect();
    if (viewer2 && viewer2.connected) viewer2.disconnect();
    if (viewer3 && viewer3.connected) viewer3.disconnect();
    streamMeshTopology.clear();
  });

  test("Should heal orphaned nodes when the broadcaster arrives late", (done) => {
    const streamId = "late_broadcaster_stream";

    // 1. Viewers join a stream that has no broadcaster yet
    viewer1 = Client(`http://localhost:${port}`);
    viewer2 = Client(`http://localhost:${port}`);

    viewer1.on("connect", () => {
      viewer1.emit("join-stream", { streamId, username: "viewer1" });
    });

    viewer2.on("connect", () => {
      viewer2.emit("join-stream", { streamId, username: "viewer2" });
    });

    setTimeout(() => {
      // Both viewers should be orphans (no parent)
      const mesh = streamMeshTopology.get(streamId);
      expect(mesh.get(viewer1.id).parent).toBeNull();
      expect(mesh.get(viewer2.id).parent).toBeNull();

      // 2. Broadcaster arrives and authenticates
      broadcaster = Client(`http://localhost:${port}`);
      const token = jwt.sign({ username: streamId }, JWT_SECRET);

      broadcaster.on("connect", () => {
        broadcaster.emit("register-auth", { token });
        broadcaster.emit("join-stream", { streamId, username: streamId });
      });

      // Broadcaster should be told to connect to at least one viewer due to healing
      let connections = 0;
      broadcaster.on("p2p-initiate-connection", ({ childId }) => {
        connections++;
        if (connections === 2) {
          // Both viewers should have been re-parented to the broadcaster
          expect(mesh.get(viewer1.id).parent).toBe(broadcaster.id);
          expect(mesh.get(viewer2.id).parent).toBe(broadcaster.id);
          done();
        }
      });
    }, 500);
  }, 10000);

  test("Should promote a host retroactively if they authenticate while in their room", (done) => {
    const hostId = "retroactive_host";
    const token = jwt.sign({ username: hostId }, JWT_SECRET);

    broadcaster = Client(`http://localhost:${port}`);

    broadcaster.on("connect", () => {
      // 1. Join as a different guest first to avoid initial promotion
      broadcaster.emit("join-stream", { streamId: hostId, username: "temporary_guest" });

      setTimeout(() => {
        const mesh = streamMeshTopology.get(hostId);
        expect(mesh.get(broadcaster.id).isBroadcaster).toBe(false);

        // 2. Authenticate
        broadcaster.emit("register-auth", { token });

        setTimeout(() => {
          // Should now be promoted to broadcaster
          expect(mesh.get(broadcaster.id).isBroadcaster).toBe(true);
          done();
        }, 200);
      }, 200);
    });
  }, 10000);
});
