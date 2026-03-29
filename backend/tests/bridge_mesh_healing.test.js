const mockDb = {
  prepare: () => ({
    run: () => ({ lastInsertRowid: 1, changes: 1 }),
    get: () => ({ credits: 100 }),
    all: () => []
  }),
  transaction: (fn) => {
    const tx = (...args) => fn(...args);
    tx.default = tx;
    return tx;
  },
  exec: () => {},
  pragma: () => {}
};

require.cache[require.resolve('../db')] = {
  exports: mockDb
};

const Client = require("socket.io-client");
const {
  server,
  io,
  streamMeshTopology,
  addNodeToMesh,
  healOrphans
} = require("../server");

describe("Bridge: Mesh Healing Integration", () => {
  let port;
  let broadcaster, viewer1, viewer2, viewer3;

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
    if (broadcaster && broadcaster.connected) broadcaster.disconnect();
    if (viewer1 && viewer1.connected) viewer1.disconnect();
    if (viewer2 && viewer2.connected) viewer2.disconnect();
    if (viewer3 && viewer3.connected) viewer3.disconnect();
    streamMeshTopology.clear();
  });

  test("should heal orphans when a node starts contributing bandwidth", (done) => {
    const streamId = "test_heal_bandwidth";

    // 1. Broadcaster connects
    broadcaster = Client(`http://localhost:${port}`);
    broadcaster.on("connect", () => {
      broadcaster.emit("join-stream", { streamId, username: streamId });
    });

    setTimeout(() => {
      // 2. Viewer 1 connects (becomes orphan since broadcaster is at capacity 2... wait, broadcaster is alone)
      // Actually MAX_CHILDREN_PER_NODE = 2.
      // Let's fill broadcaster capacity.
      viewer1 = Client(`http://localhost:${port}`);
      viewer2 = Client(`http://localhost:${port}`);

      viewer1.emit("join-stream", { streamId, username: "viewer1" });
      viewer2.emit("join-stream", { streamId, username: "viewer2" });

      setTimeout(() => {
        // Broadcaster should have 2 children
        const mesh = streamMeshTopology.get(streamId);
        expect(mesh.get(broadcaster.id).children.size).toBe(2);

        // Viewer 1 reporting 0 bandwidth
        viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 0 });

        setTimeout(() => {
          // 3. Viewer 3 joins (should be orphan because broadcaster is full and viewer1 has 0 bandwidth)
          viewer3 = Client(`http://localhost:${port}`);
          viewer3.emit("join-stream", { streamId, username: "viewer3" });

          setTimeout(() => {
            expect(mesh.get(viewer3.id).parent).toBeNull();

            // 4. Viewer 1 starts contributing
            // This should trigger healOrphans via metrics-report
            viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 50 });

            setTimeout(() => {
              // Viewer 3 should now have Viewer 1 as parent
              expect(mesh.get(viewer3.id).parent).toBe(viewer1.id);
              done();
            }, 100);
          }, 100);
        }, 100);
      }, 100);
    }, 100);
  });
});
