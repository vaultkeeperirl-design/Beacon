const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Mesh Healing Bridge - Proactive Healing & Host Promotion", () => {
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

  test("Should heal orphans when a Broadcaster joins late", (done) => {
    const streamId = "late_host_stream";

    // 1. Viewers join first (they become orphans as no host is active)
    viewer1Socket = Client(`http://localhost:${port}`);
    viewer1Socket.on("connect", () => {
      viewer1Socket.emit("join-stream", { streamId, username: "viewer1" });

      setTimeout(() => {
        viewer2Socket = Client(`http://localhost:${port}`);
        viewer2Socket.on("connect", () => {
          viewer2Socket.emit("join-stream", { streamId, username: "viewer2" });

          // 2. Host joins LATE
          setTimeout(() => {
            hostSocket = Client(`http://localhost:${port}`);
            hostSocket.on("connect", () => {
              // Authenticate host
              const token = require('jsonwebtoken').sign({ username: streamId }, require('../server').JWT_SECRET);
              hostSocket.emit("register-auth", { token });

              setTimeout(() => {
                hostSocket.emit("join-stream", { streamId, username: streamId });
              }, 100);

              // 3. Verify BOTH viewers are re-parented to the late host
              let reParentedCount = 0;
              const checkDone = () => {
                reParentedCount++;
                if (reParentedCount === 2) {
                  done();
                }
              };

              hostSocket.on("p2p-initiate-connection", ({ childId }) => {
                if (childId === viewer1Socket.id || childId === viewer2Socket.id) {
                  checkDone();
                }
              });

              setTimeout(() => {
                if (reParentedCount < 2) {
                  done(new Error(`Failed to heal all orphans. Re-parented: ${reParentedCount}/2`));
                }
              }, 4000);
            });
          }, 500);
        });
      }, 100);
    });
  }, 10000);

  test("Should retroactively promote host if they authenticate after joining room", (done) => {
    const streamId = "retroactive_host_stream";

    hostSocket = Client(`http://localhost:${port}`);
    hostSocket.on("connect", () => {
      // 1. Join as guest first
      hostSocket.emit("join-stream", { streamId, username: streamId });

      setTimeout(() => {
        // 2. Authenticate as the host
        const token = require('jsonwebtoken').sign({ username: streamId }, require('../server').JWT_SECRET);
        hostSocket.emit("register-auth", { token });

        // 3. Host should be promoted and viewers should now see the stream as active
        // We verify promotion by checking if another viewer can join and find the host as parent
        setTimeout(() => {
          viewer1Socket = Client(`http://localhost:${port}`);
          viewer1Socket.on("connect", () => {
            viewer1Socket.emit("join-stream", { streamId, username: "viewer1" });
          });

          hostSocket.on("p2p-initiate-connection", ({ childId }) => {
            if (childId === viewer1Socket.id) {
              done();
            }
          });
        }, 500);
      }, 200);
    });
  }, 10000);
});
