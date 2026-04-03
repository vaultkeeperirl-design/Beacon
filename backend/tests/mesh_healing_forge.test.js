const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io, JWT_SECRET, streamMeshTopology } = require("../server");
const jwt = require("jsonwebtoken");

describe("Forge: Mesh Healing & Retroactive Host Promotion", () => {
  let port;
  let clients = [];

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
    clients.forEach(c => c.disconnect());
    io.close();
    server.close(done);
  });

  const createAuthenticatedClient = (username) => {
    const client = Client(`http://localhost:${port}`);
    clients.push(client);
    const token = jwt.sign({ username }, JWT_SECRET);
    client.on("connect", () => {
      client.emit("register-auth", { token });
    });
    return client;
  };

  const createGuestClient = () => {
    const client = Client(`http://localhost:${port}`);
    clients.push(client);
    return client;
  };

  test("Should heal orphans when broadcaster joins late", (done) => {
    const streamId = "late_broadcaster_stream";
    const viewer1 = createGuestClient();
    const viewer2 = createGuestClient();

    viewer1.on("connect", () => {
      viewer1.emit("join-stream", { streamId, username: "viewer1" });
    });

    viewer2.on("connect", () => {
      viewer2.emit("join-stream", { streamId, username: "viewer2" });
    });

    setTimeout(() => {
      // Check that they are orphans (no parent)
      const mesh = streamMeshTopology.get(streamId);
      expect(mesh.get(viewer1.id).parent).toBeNull();
      expect(mesh.get(viewer2.id).parent).toBeNull();

      // Now broadcaster joins
      const broadcaster = createAuthenticatedClient(streamId);
      broadcaster.on("connect", () => {
        broadcaster.emit("join-stream", { streamId, username: streamId });
      });

      // Broadcaster should be assigned as parent to orphans via healOrphans
      let connections = 0;
      broadcaster.on("p2p-initiate-connection", () => {
        connections++;
        if (connections === 2) {
          const updatedMesh = streamMeshTopology.get(streamId);
          expect(updatedMesh.get(viewer1.id).parent).toBe(broadcaster.id);
          expect(updatedMesh.get(viewer2.id).parent).toBe(broadcaster.id);
          done();
        }
      });
    }, 500);
  }, 10000);

  test("Should promote guest to broadcaster retroactively on auth", (done) => {
    const streamId = "retroactive_host_stream";
    const host = createGuestClient();

    host.on("connect", () => {
      // Join as guest first (with a different username to avoid auto-broadcaster logic in join-stream)
      host.emit("join-stream", { streamId, username: "guest_host" });

      setTimeout(() => {
        const mesh = streamMeshTopology.get(streamId);
        expect(mesh.get(host.id).isBroadcaster).toBe(false);

        // Now authenticate as the stream owner
        const token = jwt.sign({ username: streamId }, JWT_SECRET);
        host.emit("register-auth", { token });

        setTimeout(() => {
          const updatedMesh = streamMeshTopology.get(streamId);
          expect(updatedMesh.get(host.id).isBroadcaster).toBe(true);
          expect(updatedMesh.get(host.id).parent).toBeNull();
          done();
        }, 500);
      }, 500);
    });
  }, 10000);
});
