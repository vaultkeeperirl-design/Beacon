const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const { server, io, activeStreams } = require("../server");

describe("Forge Mesh Healing and Host Promotion", () => {
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
    activeStreams.clear();
  });

  test("Orphaned viewers should re-parent when a broadcaster joins late (Heal Orphans)", (done) => {
    const streamId = "late_broadcaster_stream";

    // 1. Viewer 1 connects first (becomes an orphan)
    viewer1 = Client(`http://localhost:${port}`);
    viewer1.on("connect", () => {
      viewer1.emit("join-stream", { streamId, username: "viewer1" });

      setTimeout(() => {
        // 2. Viewer 2 connects (should also be an orphan, or child of V1 but V1 has no path to root)
        viewer2 = Client(`http://localhost:${port}`);
        viewer2.on("connect", () => {
          viewer2.emit("join-stream", { streamId, username: "viewer2" });

          setTimeout(() => {
             // 3. Broadcaster joins late
             broadcaster = Client(`http://localhost:${port}`);

             let healedCount = 0;
             broadcaster.on("p2p-initiate-connection", ({ childId }) => {
                if (childId === viewer1.id || childId === viewer2.id) {
                   healedCount++;
                   if (healedCount === 1) { // At least one child should be healed directly by broadcaster
                      done();
                   }
                }
             });

             broadcaster.on("connect", () => {
               broadcaster.emit("join-stream", { streamId, username: streamId });
             });
          }, 500);
        });
      }, 500);
    });
  }, 10000);
});
