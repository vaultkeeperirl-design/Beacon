const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Mesh Cleanup Bridge", () => {
  let port;
  let hostSocket, viewer1Socket, viewer2Socket;

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
    if (hostSocket && hostSocket.connected) hostSocket.disconnect();
    if (viewer1Socket && viewer1Socket.connected) viewer1Socket.disconnect();
    if (viewer2Socket && viewer2Socket.connected) viewer2Socket.disconnect();
  });

  test("Should remove node from mesh and re-parent children when switching rooms", (done) => {
    const streamA = "stream-A";
    const streamB = "stream-B";

    // 1. Setup Stream A with Host, Viewer 1, and Viewer 2 (child of Viewer 1)
    hostSocket = Client(`http://localhost:${port}`);
    hostSocket.on("connect", () => {
      hostSocket.emit("join-stream", { streamId: streamA, username: streamA });

      setTimeout(() => {
        viewer1Socket = Client(`http://localhost:${port}`);
        viewer1Socket.on("connect", () => {
          viewer1Socket.emit("join-stream", { streamId: streamA, username: "viewer1" });

          // Mock viewer1 reporting good stats to be a parent
          viewer1Socket.emit("metrics-report", { streamId: streamA, latency: 10, uploadMbps: 100 });

          setTimeout(() => {
            viewer2Socket = Client(`http://localhost:${port}`);
            viewer2Socket.on("connect", () => {
              viewer2Socket.emit("join-stream", { streamId: streamA, username: "viewer2" });
            });

            // Ensure viewer2 is assigned to viewer1
            viewer1Socket.once("p2p-initiate-connection", ({ childId }) => {
              expect(childId).toBe(viewer2Socket.id);

              // 2. Viewer 1 switches to Stream B
              // This SHOULD trigger removeNodeFromMesh(streamA, viewer1.id)
              viewer1Socket.emit("join-stream", { streamId: streamB, username: "viewer1" });

              // 3. Verify Viewer 2 is re-parented to Host in Stream A
              const timeout = setTimeout(() => {
                done(new Error("Mesh failed to heal: Viewer 2 was not re-parented to Host after Viewer 1 switched rooms"));
              }, 2000);

              hostSocket.once("p2p-initiate-connection", ({ childId }) => {
                if (childId === viewer2Socket.id) {
                  clearTimeout(timeout);
                  done();
                }
              });
            });
          }, 100);
        });
      }, 100);
    });
  });
});
