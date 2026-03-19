const Client = require("socket.io-client");
const request = require('supertest');
const { server, io, JWT_SECRET } = require("../server");
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe("Revenue Sharing Bridge: Proportional & Sybil-resistant", () => {
  let port;
  let broadcasterToken, tipperToken;
  let broadcasterUser, tipperUser, relayer1User, relayer2User;

  beforeAll(async () => {
    const timestamp = Date.now();
    broadcasterUser = `host_${timestamp}`;
    tipperUser = `tipper_${timestamp}`;
    relayer1User = `relayer1_${timestamp}`;
    relayer2User = `relayer2_${timestamp}`;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const insertStmt = db.prepare('INSERT INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');
    insertStmt.run(broadcasterUser, hash, 0.0);
    insertStmt.run(tipperUser, hash, 1000.0);
    insertStmt.run(relayer1User, hash, 0.0);
    insertStmt.run(relayer2User, hash, 0.0);

    broadcasterToken = jwt.sign({ username: broadcasterUser }, JWT_SECRET);
    tipperToken = jwt.sign({ username: tipperUser }, JWT_SECRET);
    relayer1Token = jwt.sign({ username: relayer1User }, JWT_SECRET);
    relayer2Token = jwt.sign({ username: relayer2User }, JWT_SECRET);

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

  test("Should distribute Tip 80/20 and reward relayers proportionally based on bandwidth", (done) => {
    const streamId = broadcasterUser;
    const broadcasterSocket = Client(`http://localhost:${port}`);
    const relayer1Socket = Client(`http://localhost:${port}`);
    const relayer1SocketTab2 = Client(`http://localhost:${port}`); // Same user, second tab
    const relayer2Socket = Client(`http://localhost:${port}`);

    let readyCount = 0;
    const checkReady = () => {
      readyCount++;
      if (readyCount === 4) {
        // Report metrics
        // Relayer 1: Tab 1 (10 Mbps) + Tab 2 (10 Mbps) = 20 Mbps total
        // Relayer 2: 60 Mbps total
        // Total Relay Bandwidth: 80 Mbps
        // Relayer 1 Share: 25% of relay portion
        // Relayer 2 Share: 75% of relay portion

        relayer1Socket.emit("metrics-report", { streamId, latency: 50, uploadMbps: 10 });
        relayer1SocketTab2.emit("metrics-report", { streamId, latency: 50, uploadMbps: 10 });
        relayer2Socket.emit("metrics-report", { streamId, latency: 50, uploadMbps: 60 });

        setTimeout(async () => {
          try {
            // Send Tip: 100 CR
            // Relay portion (20%): 20 CR
            // Squad portion (80%): 80 CR (Host gets 100% of squad)

            const res = await request(server)
              .post('/api/tip')
              .set('Authorization', `Bearer ${tipperToken}`)
              .send({ streamId, amount: 100 });

            expect(res.statusCode).toBe(200);

            setTimeout(() => {
              const hostCredits = db.prepare('SELECT credits FROM Users WHERE username = ?').get(broadcasterUser).credits;
              const r1Credits = db.prepare('SELECT credits FROM Users WHERE username = ?').get(relayer1User).credits;
              const r2Credits = db.prepare('SELECT credits FROM Users WHERE username = ?').get(relayer2User).credits;

              // Host: 80 CR
              expect(hostCredits).toBeCloseTo(80.0);

              // Relayer 1: 25% of 20 CR = 5 CR
              // Plus metrics-report rewards: 0.1 (tab1) + 0.1 (tab2) = 0.2
              expect(r1Credits).toBeCloseTo(5.2);

              // Relayer 2: 75% of 20 CR = 15 CR
              // Plus metrics-report reward: 0.6
              expect(r2Credits).toBeCloseTo(15.6);

              broadcasterSocket.close();
              relayer1Socket.close();
              relayer1SocketTab2.close();
              relayer2Socket.close();
              done();
            }, 500);
          } catch (err) {
            done(err);
          }
        }, 500);
      }
    };

    broadcasterSocket.on("connect", () => {
      broadcasterSocket.emit("register-auth", { token: broadcasterToken });
      broadcasterSocket.emit("join-stream", { streamId, username: broadcasterUser });
      checkReady();
    });
    relayer1Socket.on("connect", () => {
      relayer1Socket.emit("register-auth", { token: relayer1Token });
      relayer1Socket.emit("join-stream", { streamId, username: relayer1User });
      checkReady();
    });
    relayer1SocketTab2.on("connect", () => {
      relayer1SocketTab2.emit("register-auth", { token: relayer1Token });
      relayer1SocketTab2.emit("join-stream", { streamId, username: relayer1User });
      checkReady();
    });
    relayer2Socket.on("connect", () => {
      relayer2Socket.emit("register-auth", { token: relayer2Token });
      relayer2Socket.emit("join-stream", { streamId, username: relayer2User });
      checkReady();
    });
  }, 10000);
});
