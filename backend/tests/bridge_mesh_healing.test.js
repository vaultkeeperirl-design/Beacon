const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

// Mock the database before importing server
const mockDb = {
  prepare: () => ({
    get: () => ({ id: 1, username: 'testuser', credits: 100 }),
    run: () => ({ lastInsertRowid: 1, changes: 1 }),
    all: () => []
  }),
  transaction: (fn) => fn,
  pragma: () => {}
};

require.cache[require.resolve('../db')] = {
  exports: mockDb
};

const { server, io } = require("../server");

describe("Mesh Network Tree Healing and Routing (Mocked DB)", () => {
  let port;
  let broadcaster, viewer1, viewer2, viewer3;

  beforeAll((done) => {
    // Only listen if not already listening
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
  });

  test("Should route Viewers based on latency and reparent them when Viewer 1 disconnects", (done) => {
    const streamId = "test_stream_healing";

    // 1. Broadcaster connects
    broadcaster = Client(`http://localhost:${port}`);
    broadcaster.on("connect", () => {
      broadcaster.emit("join-stream", { streamId, username: streamId });
    });

    setTimeout(() => {
      // 2. Viewer 1 connects (should connect directly to broadcaster)
      viewer1 = Client(`http://localhost:${port}`);
      viewer1.on("connect", () => {
        viewer1.emit("join-stream", { streamId, username: "viewer1" });
      });

      // Broadcaster should be told to connect to Viewer 1
      broadcaster.once("p2p-initiate-connection", ({ childId }) => {
        expect(childId).toBe(viewer1.id);

        // Simulate Viewer 1 reporting great stats
        viewer1.emit("metrics-report", { streamId, latency: 10, uploadMbps: 100 });

        setTimeout(() => {
          // 3. Viewer 2 and 3 connect
          viewer2 = Client(`http://localhost:${port}`);
          viewer3 = Client(`http://localhost:${port}`);

          let connectionsInitiated = 0;
          let testCompleted = false;

          const checkConnections = () => {
            if (connectionsInitiated === 2) {
              // Now that Viewer 2 and 3 are connected to Viewer 1 or Broadcaster...
              // 4. Force Viewer 1 to disconnect
              viewer1.disconnect();

              // Wait for re-parenting. When Viewer 1 disconnects, Viewer 2 (its child)
              // should be orphaned and then re-assigned to the Broadcaster.
              broadcaster.on("p2p-initiate-connection", ({ childId }) => {
                if (testCompleted) return;
                if (childId === viewer2.id) {
                  testCompleted = true;
                  done();
                }
              });

              // If it fails to heal within 2 seconds, fail the test
              setTimeout(() => {
                if (!testCompleted) {
                   done(new Error("Mesh failed to heal: Orphaned viewer was not re-parented to broadcaster"));
                }
              }, 2000);
            }
          };

          viewer1.on("p2p-initiate-connection", () => {
             connectionsInitiated++;
             checkConnections();
          });

          broadcaster.on("p2p-initiate-connection", () => {
             connectionsInitiated++;
             checkConnections();
          });

          viewer2.on("connect", () => {
            viewer2.emit("join-stream", { streamId, username: "viewer2" });
          });

          viewer3.on("connect", () => {
            viewer3.emit("join-stream", { streamId, username: "viewer3" });
          });

        }, 500); // Wait 500ms to ensure metrics report is processed
      });
    }, 100);
  }, 10000);
});
