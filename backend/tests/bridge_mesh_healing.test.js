const Client = require("socket.io-client");
const { server, io } = require("../server");

describe("Mesh Network Tree Healing and Broadcaster Promotion", () => {
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

  test("Should adopt orphaned viewers when a broadcaster joins later", (done) => {
    const streamId = "test_stream_healing";
    let orphansAdopted = 0;

    // 1. Viewers connect (no broadcaster yet)
    viewer1 = Client(`http://localhost:${port}`);
    viewer2 = Client(`http://localhost:${port}`);

    viewer1.on("connect", () => {
        viewer1.emit("join-stream", { streamId, username: "viewer1" });
    });

    viewer2.on("connect", () => {
        viewer2.emit("join-stream", { streamId, username: "viewer2" });
    });

    setTimeout(() => {
      // 2. Broadcaster connects
      broadcaster = Client(`http://localhost:${port}`);

      broadcaster.on("p2p-initiate-connection", ({ childId }) => {
        if (childId === viewer1.id || childId === viewer2.id) {
           orphansAdopted++;
           if (orphansAdopted === 2) {
             done();
           }
        }
      });

      broadcaster.on("connect", () => {
        broadcaster.emit("join-stream", { streamId, username: streamId });
      });
    }, 500);

    // Timeout if healing fails
    setTimeout(() => {
      if (orphansAdopted < 2) {
         done(new Error(`Only ${orphansAdopted}/2 orphans were adopted`));
      }
    }, 4000);
  }, 10000);

  test("Should promote a viewer to broadcaster and sever parent relationship", (done) => {
    const streamId = "host_promo";

    // 1. Broadcaster connects
    broadcaster = Client(`http://localhost:${port}`);
    broadcaster.on("connect", () => {
      broadcaster.emit("join-stream", { streamId, username: streamId });
    });

    setTimeout(() => {
      // 2. Viewer 1 connects (should be child of broadcaster)
      viewer1 = Client(`http://localhost:${port}`);

      viewer1.on("connect", () => {
          viewer1.emit("join-stream", { streamId, username: "viewer1" });
      });

      broadcaster.on("p2p-initiate-connection", ({ childId }) => {
        if (childId === viewer1.id) {
            // 3. Now promote Viewer 1 to Broadcaster (by having them join a room matching their own name)
            // In the real app, this happens if a user is already in a room and then authenticates as the owner.
            // But here we can simulate by viewer1 joining their own room.
            const newStreamId = "viewer1";
            viewer1.emit("join-stream", { streamId: newStreamId, username: newStreamId });

            setTimeout(() => {
                const { streamMeshTopology } = require("../server");
                const mesh = streamMeshTopology.get(newStreamId);
                const node = mesh.get(viewer1.id);

                if (node && node.isBroadcaster && node.parent === null) {
                  done();
                } else {
                  done(new Error("Viewer was not promoted correctly"));
                }
            }, 500);
        }
      });
    }, 500);
  }, 10000);
});
