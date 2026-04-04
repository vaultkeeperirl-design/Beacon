const Client = require("socket.io-client");
const { server, io, streamMeshTopology, addNodeToMesh, healOrphans } = require("../server");

describe("Mesh Network Proactive Healing", () => {
  let port;
  let broadcaster, viewer1, viewer2;

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
  });

  test("Node should detach from parent when promoted to broadcaster", (done) => {
    const streamId = "promotion_stream";

    // 1. Broadcaster (A) connects
    const broadcasterA = Client(`http://localhost:${port}`);
    broadcasterA.on("connect", () => {
        broadcasterA.emit("join-stream", { streamId, username: streamId });

        setTimeout(() => {
            // 2. Viewer 1 connects and joins Broadcaster A
            viewer1 = Client(`http://localhost:${port}`);
            viewer1.on("connect", () => {
                viewer1.emit("join-stream", { streamId, username: "viewer1" });

                broadcasterA.once("p2p-initiate-connection", ({ childId }) => {
                    expect(childId).toBe(viewer1.id);

                    // 3. Viewer 1 reports bandwidth and Viewer 2 joins Viewer 1
                    viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 100 });

                    setTimeout(() => {
                        viewer2 = Client(`http://localhost:${port}`);
                        viewer2.on("connect", () => {
                            viewer2.emit("join-stream", { streamId, username: "viewer2" });
                        });

                        viewer1.once("p2p-initiate-connection", ({ childId }) => {
                            expect(childId).toBe(viewer2.id);

                            // 4. Promote Viewer 2 to broadcaster
                            const newStreamId = "viewer2_host";
                            viewer2.emit("join-stream", { streamId: newStreamId, username: newStreamId });

                            setTimeout(() => {
                                // Check mesh state in server
                                const topology = streamMeshTopology.get(newStreamId);
                                const node = topology.get(viewer2.id);

                                expect(node.isBroadcaster).toBe(true);
                                expect(node.parent).toBeNull();

                                broadcasterA.disconnect();
                                done();
                            }, 1000);
                        });
                    }, 1000);
                });
            });
        }, 1000);
    });
  }, 25000);

  test("healOrphans should correctly re-parent an island node", (done) => {
     // This test uses the exported functions to test the logic directly on the topology
     const streamId = "direct_healing_test";
     const bId = "broadcaster";
     const v1Id = "viewer1";
     const v2Id = "viewer2";

     // 1. Setup manual topology
     if (!streamMeshTopology.has(streamId)) {
        streamMeshTopology.set(streamId, new Map());
     }
     const mesh = streamMeshTopology.get(streamId);

     mesh.set(bId, { children: new Set(), parent: null, isBroadcaster: true, metrics: { latency: 0, uploadMbps: 100 } });
     mesh.set(v1Id, { children: new Set(), parent: null, isBroadcaster: false, metrics: { latency: 10, uploadMbps: 0 } });
     mesh.set(v2Id, { children: new Set(), parent: null, isBroadcaster: false, metrics: { latency: 10, uploadMbps: 0 } });

     // 2. Heal
     healOrphans(streamId);

     // 3. Verify they joined the broadcaster
     expect(mesh.get(v1Id).parent).toBe(bId);
     expect(mesh.get(v2Id).parent).toBe(bId);
     expect(mesh.get(bId).children.has(v1Id)).toBe(true);
     expect(mesh.get(bId).children.has(v2Id)).toBe(true);

     // 4. Create an island: detach v1 from b, v2 from b, but point v2 to v1
     mesh.get(bId).children.clear();
     mesh.get(v1Id).parent = null;
     mesh.get(v2Id).parent = v1Id;
     mesh.get(v1Id).children.add(v2Id);

     // Heal - should identify v1 as orphan (no parent) and v2 as island (no path to broadcaster)
     healOrphans(streamId);

     expect(mesh.get(v1Id).parent).toBe(bId);
     expect(mesh.get(v2Id).parent).toBe(bId);

     done();
  });
});
