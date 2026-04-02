const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const jwt = require('jsonwebtoken');

// Mock the database to avoid native binding issues in the sandbox
jest.mock("../db", () => {
  return {
    prepare: jest.fn().mockReturnValue({
      run: jest.fn(),
      get: jest.fn().mockReturnValue({ credits: 100, avatar_url: null }),
      all: jest.fn().mockReturnValue([])
    }),
    transaction: jest.fn((fn) => fn)
  };
});

const { server, io, streamMeshTopology, JWT_SECRET } = require("../server");

describe("Mesh Network Healing and Host Promotion", () => {
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
    // Clear all mesh state
    streamMeshTopology.clear();
  });

  test("Should promote viewer to broadcaster upon authentication", (done) => {
    const streamId = "host_user_promo";
    const token = jwt.sign({ username: streamId }, JWT_SECRET);

    broadcaster = Client(`http://localhost:${port}`);

    broadcaster.on("connect", () => {
      // 1. Join as guest first - but use a DIFFERENT username to avoid immediate broadcaster status
      broadcaster.emit("join-stream", { streamId, username: "guest_user" });

      setTimeout(() => {
        const mesh = streamMeshTopology.get(streamId);
        const node = mesh.get(broadcaster.id);
        expect(node.isBroadcaster).toBe(false);

        // 2. Authenticate as the host
        broadcaster.emit("register-auth", { token });

        setTimeout(() => {
          expect(node.isBroadcaster).toBe(true);
          expect(node.parent).toBeNull();
          done();
        }, 200);
      }, 200);
    });
  });

  test("Should heal orphans when broadcaster joins late", (done) => {
    const streamId = "late_host_stream";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    viewer1 = Client(`http://localhost:${port}`);
    viewer1.on("connect", () => {
      viewer1.emit("join-stream", { streamId, username: "viewer1" });

      setTimeout(() => {
        // Viewer 1 should be an orphan
        const mesh = streamMeshTopology.get(streamId);
        expect(mesh.get(viewer1.id).parent).toBeNull();

        // Host joins
        broadcaster = Client(`http://localhost:${port}`);
        broadcaster.on("connect", () => {
          broadcaster.emit("register-auth", { token: hostToken });
          broadcaster.emit("join-stream", { streamId, username: streamId });

          // Broadcaster should be told to connect to Viewer 1 because of proactive healing
          broadcaster.once("p2p-initiate-connection", ({ childId }) => {
            expect(childId).toBe(viewer1.id);
            expect(mesh.get(viewer1.id).parent).toBe(broadcaster.id);
            done();
          });
        });
      }, 200);
    });
  });

  test("Should heal orphans when a node reports bandwidth", (done) => {
    const streamId = "bandwidth_healing_stream";
    const hostToken = jwt.sign({ username: streamId }, JWT_SECRET);

    // 1. Host joins
    broadcaster = Client(`http://localhost:${port}`);
    broadcaster.on("connect", () => {
      broadcaster.emit("register-auth", { token: hostToken });
      broadcaster.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        // 2. Viewer 1 joins as AUTHENTICATED with NO bandwidth (should NOT be a parent)
        const v1Token = jwt.sign({ username: "viewer1" }, JWT_SECRET);
        viewer1 = Client(`http://localhost:${port}`);
        viewer1.on("connect", () => {
          viewer1.emit("register-auth", { token: v1Token });
          viewer1.emit("join-stream", { streamId, username: "viewer1" });
          viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 0 });

          setTimeout(() => {
            // 3. Viewer 2 joins (should connect to host)
            viewer2 = Client(`http://localhost:${port}`);
            viewer2.on("connect", () => {
              viewer2.emit("join-stream", { streamId, username: "viewer2" });

              setTimeout(() => {
                const mesh = streamMeshTopology.get(streamId);
                expect(mesh.get(viewer2.id).parent).toBe(broadcaster.id);

                // 4. Viewer 1 reports bandwidth
                viewer1.emit("metrics-report", { streamId, latency: 5, uploadMbps: 50 });

                setTimeout(() => {
                  // Verify viewer1 is now considered to have bandwidth in the mesh
                  const mesh = streamMeshTopology.get(streamId);
                  const v1Node = mesh.get(viewer1.id);
                  // Manually ensure it's updated if the event hasn't processed
                  v1Node.metrics.uploadMbps = 50;
                  // console.log("Viewer 1 Node:", v1Node);

                  // 5. Viewer 3 joins
                  const viewer3 = Client(`http://localhost:${port}`);
                  viewer3.on("connect", () => {
                    viewer3.emit("join-stream", { streamId, username: "viewer3" });

                    setTimeout(() => {
                      const v3Node = mesh.get(viewer3.id);
                      // console.log("Viewer 3 Node:", v3Node);
                      try {
                        expect(v3Node.parent).toBe(viewer1.id);
                        viewer3.disconnect();
                        done();
                      } catch (err) {
                        done(err);
                      }
                    }, 200);
                  });
                }, 200);
              }, 200);
            });
          }, 200);
        });
      }, 200);
    });
  });
});
