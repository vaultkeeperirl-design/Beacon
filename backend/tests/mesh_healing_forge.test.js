const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe("P2P Mesh Healing & Retroactive Promotion (Forge)", () => {
  let port;
  let broadcasterSocket, viewer1Socket, viewer2Socket;
  let broadcasterToken, viewer1Token, viewer2Token;
  let broadcasterUser, viewer1User, viewer2User;

  beforeAll(async () => {
    const timestamp = Date.now();
    broadcasterUser = `host_${timestamp}`;
    viewer1User = `v1_${timestamp}`;
    viewer2User = `v2_${timestamp}`;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const insertStmt = db.prepare('INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');
    insertStmt.run(broadcasterUser, hash, 0.0);
    insertStmt.run(viewer1User, hash, 0.0);
    insertStmt.run(viewer2User, hash, 0.0);

    const hostId = db.prepare('SELECT id FROM Users WHERE username = ?').get(broadcasterUser).id;
    const v1Id = db.prepare('SELECT id FROM Users WHERE username = ?').get(viewer1User).id;
    const v2Id = db.prepare('SELECT id FROM Users WHERE username = ?').get(viewer2User).id;

    broadcasterToken = jwt.sign({ id: hostId, username: broadcasterUser }, JWT_SECRET, { expiresIn: '1h' });
    viewer1Token = jwt.sign({ id: v1Id, username: viewer1User }, JWT_SECRET, { expiresIn: '1h' });
    viewer2Token = jwt.sign({ id: v2Id, username: viewer2User }, JWT_SECRET, { expiresIn: '1h' });

    return new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    if (broadcasterSocket) broadcasterSocket.close();
    if (viewer1Socket) viewer1Socket.close();
    if (viewer2Socket) viewer2Socket.close();
  });

  test("Should heal orphans when a broadcaster joins late (Retroactive Promotion)", (done) => {
    const streamId = broadcasterUser;

    // 1. Viewers join BEFORE broadcaster
    viewer1Socket = Client(`http://localhost:${port}`);
    viewer2Socket = Client(`http://localhost:${port}`);

    let v1Joined = false;
    let v2Joined = false;

    const checkViewersJoined = () => {
      if (v1Joined && v2Joined) {
        // Wait to ensure they are marked as orphans (no parent found)
        setTimeout(() => {
          // 2. Broadcaster connects AND authenticates (retroactive promotion)
          broadcasterSocket = Client(`http://localhost:${port}`);
          broadcasterSocket.on("connect", () => {
            // First join as guest
            broadcasterSocket.emit("join-stream", { streamId, username: null });

            setTimeout(() => {
              // Now authenticate - this should trigger promotion and healOrphans
              broadcasterSocket.emit("register-auth", { token: broadcasterToken });
            }, 200);
          });

          // 3. Verify viewers are re-parented to the new broadcaster
          let v1Healed = false;
          let v2Healed = false;

          broadcasterSocket.on("p2p-initiate-connection", ({ childId }) => {
            if (childId === viewer1Socket.id) v1Healed = true;
            if (childId === viewer2Socket.id) v2Healed = true;

            if (v1Healed && v2Healed) {
              done();
            }
          });
        }, 500);
      }
    };

    viewer1Socket.on("connect", () => {
      viewer1Socket.emit("join-stream", { streamId, username: viewer1User });
      v1Joined = true;
      checkViewersJoined();
    });

    viewer2Socket.on("connect", () => {
      viewer2Socket.emit("join-stream", { streamId, username: viewer2User });
      v2Joined = true;
      checkViewersJoined();
    });
  }, 10000);

  test("Should heal orphans when a peer gains capacity via metrics-report", (done) => {
    const streamId = `capacity_test_${Date.now()}`;
    const hostUser = `host_cap_${Date.now()}`;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('password123', salt);
    db.prepare('INSERT INTO Users (username, password_hash, credits) VALUES (?, ?, ?)').run(hostUser, hash, 0.0);
    const hostId = db.prepare('SELECT id FROM Users WHERE username = ?').get(hostUser).id;
    const hostToken = jwt.sign({ id: hostId, username: hostUser }, JWT_SECRET, { expiresIn: '1h' });

    broadcasterSocket = Client(`http://localhost:${port}`);
    viewer1Socket = Client(`http://localhost:${port}`);
    viewer2Socket = Client(`http://localhost:${port}`);

    broadcasterSocket.on("connect", () => {
      broadcasterSocket.emit("register-auth", { token: hostToken });
      broadcasterSocket.emit("join-stream", { streamId: hostUser, username: hostUser });
    });

    viewer1Socket.on("connect", () => {
      viewer1Socket.emit("register-auth", { token: viewer1Token });
      viewer1Socket.emit("join-stream", { streamId: hostUser, username: viewer1User });

      // V1 reports 0 upload initially (cannot be a parent)
      viewer1Socket.emit("metrics-report", { streamId: hostUser, latency: 10, uploadMbps: 0 });

      setTimeout(() => {
        viewer2Socket.emit("join-stream", { streamId: hostUser, username: viewer2User });
      }, 500);
    });

    // Broadcaster will be parent of V1 and V2 initially (MAX_CHILDREN=2).
    // To test metrics-based healing, we need to fill the broadcaster and then have a 3rd viewer join.
    const viewer3Socket = Client(`http://localhost:${port}`);
    let connections = 0;

    const onBroadcasterInit = ({ childId }) => {
      connections++;
      if (connections === 2) {
        // Broadcaster is now full (V1 and V2 connected).
        // 1. Viewer 3 joins as an orphan because broadcaster is full and V1/V2 have 0 upload.
        viewer3Socket.emit("join-stream", { streamId: hostUser, username: "v3_" + Date.now() });

        setTimeout(() => {
          // 2. V1 reports positive uploadMbps, becoming a viable parent.
          // This should trigger healOrphans and re-parent V3 to V1.
          viewer1Socket.emit("metrics-report", { streamId: hostUser, latency: 10, uploadMbps: 20 });
        }, 800);
      }
    };

    broadcasterSocket.on("p2p-initiate-connection", onBroadcasterInit);

    viewer1Socket.on("p2p-initiate-connection", ({ childId }) => {
      // 3. Verify V1 is assigned V3 as a child
      if (childId === viewer3Socket.id) {
        viewer3Socket.close();
        done();
      }
    });

    viewer3Socket.on("connect", () => {
      // Waiting for join-stream to be emitted in the timeout above
    });
  }, 15000);
});
