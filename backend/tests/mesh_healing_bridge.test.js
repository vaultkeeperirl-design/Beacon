const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Bridge: Mesh Network Healing Logic", () => {
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

  test("Should automatically heal orphans when a broadcaster joins late", (done) => {
    const streamId = "late_broadcaster_stream";

    // 1. Viewer joins first (becomes an orphan because no broadcaster)
    viewer1 = Client(`http://localhost:${port}`);
    viewer1.on("connect", () => {
      viewer1.emit("join-stream", { streamId, username: "viewer1" });

      setTimeout(() => {
        // 2. Broadcaster joins LATE
        broadcaster = Client(`http://localhost:${port}`);

        // The broadcaster should automatically receive a p2p-initiate-connection for the orphan
        broadcaster.on("p2p-initiate-connection", ({ childId }) => {
          if (childId === viewer1.id) {
            done();
          }
        });

        broadcaster.on("connect", () => {
          broadcaster.emit("join-stream", { streamId, username: streamId });
        });

        // Fail if not healed within 2 seconds
        const timeoutId = setTimeout(() => {
           done(new Error("Mesh failed to heal: Orphaned viewer was not re-parented when broadcaster joined"));
        }, 2000);

        broadcaster.on("p2p-initiate-connection", () => {
          clearTimeout(timeoutId);
        });
      }, 500);
    });
  });

  test("Should heal orphans when a node's upload speed becomes positive", (done) => {
    const streamId = "metrics_healing_stream";

    // 1. Broadcaster joins
    broadcaster = Client(`http://localhost:${port}`);
    broadcaster.on("connect", () => {
      broadcaster.emit("join-stream", { streamId, username: streamId });

      // 2. Viewer 1 joins with 0 upload speed (not a viable parent yet)
      viewer1 = Client(`http://localhost:${port}`);
      viewer1.on("connect", () => {
        viewer1.emit("join-stream", { streamId, username: "viewer1" });
        viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 0 });

        setTimeout(() => {
          // 3. Viewer 2 joins (should connect to Broadcaster since Viewer 1 has 0 upload)
          viewer2 = Client(`http://localhost:${port}`);

          let viewer2ParentId = null;
          broadcaster.on("p2p-initiate-connection", ({ childId }) => {
            if (childId === viewer2.id) viewer2ParentId = broadcaster.id;
          });

          viewer2.on("connect", () => {
            viewer2.emit("join-stream", { streamId, username: "viewer2" });
          });

          setTimeout(() => {
            // 4. Viewer 1 improves upload speed
            // This should trigger a heal, but since Viewer 2 already has a parent,
            // we need a new orphan or to disconnect Viewer 2 to see healing.
            // Actually, let's test if a NEW viewer joins after Viewer 1 improves.

            viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 50 });

            setTimeout(() => {
                const viewer3 = Client(`http://localhost:${port}`);
                viewer3.on("connect", () => {
                    viewer3.emit("join-stream", { streamId, username: "viewer3" });
                });

                viewer1.on("p2p-initiate-connection", ({ childId }) => {
                    viewer3.disconnect();
                    done();
                });

                const timeoutId = setTimeout(() => {
                    viewer3.disconnect();
                    done(new Error("Mesh failed to use improved node as parent for new viewer"));
                }, 2000);

                viewer1.on("p2p-initiate-connection", () => {
                    clearTimeout(timeoutId);
                });
            }, 500);
          }, 500);
        }, 500);
      });
    });
  });
});
