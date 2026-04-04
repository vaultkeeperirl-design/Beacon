const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Mesh Network Proactive Healing", () => {
  let port;
  let broadcaster, viewer1, viewer2, orphan;

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
    [broadcaster, viewer1, viewer2, orphan].forEach(s => {
      if (s && s.connected) s.disconnect();
    });
    // Wait for server to process disconnects
    return new Promise(resolve => setTimeout(resolve, 500));
  });

  test("Should heal orphans when a new potential parent gains upload capacity", (done) => {
    const streamId = `healing_test_stream_${Date.now()}`;

    // 1. Broadcaster connects
    broadcaster = Client(`http://localhost:${port}`);
    broadcaster.on("connect", () => {
      broadcaster.emit("join-stream", { streamId, username: streamId });
    });

    setTimeout(() => {
      // 2. Viewer 1 connects (should connect to broadcaster)
      viewer1 = Client(`http://localhost:${port}`);
      viewer1.on("connect", () => {
        viewer1.emit("join-stream", { streamId, username: "viewer1" });
      });

      // 3. Viewer 2 connects (should connect to broadcaster as well, filling its 2 slots)
      viewer2 = Client(`http://localhost:${port}`);
      viewer2.on("connect", () => {
        viewer2.emit("join-stream", { streamId, username: "viewer2" });
      });

      setTimeout(() => {
        // 4. Orphan connects (No slots left on broadcaster, and V1/V2 have 0 upload)
        orphan = Client(`http://localhost:${port}`);
        orphan.on("connect", () => {
          orphan.emit("join-stream", { streamId, username: "orphan" });
        });

        // 5. Wait for orphan to be joined, then simulate Viewer 1 gaining capacity
        setTimeout(() => {
          // At this point, orphan should have no parent
          // Now, Viewer 1 reports upload capacity
          // ⚡ PERFORMANCE: Use a higher upload rate to ensure it's preferred
          viewer1.emit("metrics-report", { streamId: streamId, latency: 10, uploadMbps: 50 });

          // Viewer 1 should be notified to connect to the orphan as a child
          viewer1.on("p2p-initiate-connection", ({ childId }) => {
            if (childId === orphan.id) {
              done();
            }
          });

          // Timeout if healing doesn't happen
          setTimeout(() => {
            done(new Error("Mesh failed to heal: Orphan was not assigned to Viewer 1 after it gained capacity"));
          }, 2000);
        }, 500);
      }, 500);
    }, 200);
  }, 10000);
});
