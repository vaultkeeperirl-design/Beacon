const Client = require("socket.io-client");
const request = require('supertest');
const { server, io, JWT_SECRET } = require("../server");
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe("Relay Revenue Split (Forge Implementation)", () => {
  let port;
  let broadcasterSocket, relayerSocket, squadSocket;
  let broadcasterToken, relayerToken, squadToken;
  let broadcasterUser, relayerUser, squadUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    broadcasterUser = `host_${timestamp}`;
    relayerUser = `relayer_${timestamp}`;
    squadUser = `squad_${timestamp}`;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const insertStmt = db.prepare('INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');
    const hostInfo = insertStmt.run(broadcasterUser, hash, 0.0);
    const relayerInfo = insertStmt.run(relayerUser, hash, 0.0);
    const squadInfo = insertStmt.run(squadUser, hash, 0.0);

    let hostId = hostInfo.lastInsertRowid;
    let relayerId = relayerInfo.lastInsertRowid;
    let squadId = squadInfo.lastInsertRowid;

    if (hostInfo.changes === 0) {
      db.prepare('UPDATE Users SET credits = 0.0 WHERE username = ?').run(broadcasterUser);
      hostId = db.prepare('SELECT id FROM Users WHERE username = ?').get(broadcasterUser).id;
    }
    if (relayerInfo.changes === 0) {
      db.prepare('UPDATE Users SET credits = 0.0 WHERE username = ?').run(relayerUser);
      relayerId = db.prepare('SELECT id FROM Users WHERE username = ?').get(relayerUser).id;
    }
    if (squadInfo.changes === 0) {
      db.prepare('UPDATE Users SET credits = 0.0 WHERE username = ?').run(squadUser);
      squadId = db.prepare('SELECT id FROM Users WHERE username = ?').get(squadUser).id;
    }

    broadcasterToken = jwt.sign({ id: hostId, username: broadcasterUser }, JWT_SECRET, { expiresIn: '1h' });
    relayerToken = jwt.sign({ id: relayerId, username: relayerUser }, JWT_SECRET, { expiresIn: '1h' });
    squadToken = jwt.sign({ id: squadId, username: squadUser }, JWT_SECRET, { expiresIn: '1h' });

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
    if (relayerSocket) relayerSocket.close();
    if (squadSocket) squadSocket.close();
  });

  test("Should distribute 20% of ad revenue to active relayers and 80% to squad", (done) => {
    const streamId = broadcasterUser;

    // 1. Connect all parties
    broadcasterSocket = Client(`http://localhost:${port}`);
    relayerSocket = Client(`http://localhost:${port}`);
    squadSocket = Client(`http://localhost:${port}`);

    let hostReady = false;
    let relayerReady = false;

    const checkReady = async () => {
      if (hostReady && relayerReady) {
        // Wait a bit to ensure room count is updated in Socket.io
        setTimeout(async () => {
          // Trigger Ad Break
          try {
            // viewersCount should be 3 (broadcaster + relayer + squad member)
            // revenue = 3 * 0.5 = 1.5 CR
            // 20% (0.3 CR) to relayers (1 relayer)
            // 80% (1.2 CR) to squad (host 50%, squad 50%)

            const res = await request(server)
              .post('/api/ads/trigger')
              .set('Authorization', `Bearer ${broadcasterToken}`)
              .send({ streamId });

            expect(res.statusCode).toBe(200);
            expect(res.body.revenue).toBe(1.5);

          // Wait for DB updates
          setTimeout(() => {
            const hostCredits = db.prepare('SELECT credits FROM Users WHERE username = ?').get(broadcasterUser).credits;
            const squadCredits = db.prepare('SELECT credits FROM Users WHERE username = ?').get(squadUser).credits;
            const relayerCredits = db.prepare('SELECT credits FROM Users WHERE username = ?').get(relayerUser).credits;

            // Host: 1.2 * 0.5 = 0.6
            // Squad: 1.2 * 0.5 = 0.6
            // Relayer: 0.3 + 0.1 (from metrics-report)
            expect(hostCredits).toBeCloseTo(0.6);
            expect(squadCredits).toBeCloseTo(0.6);
            expect(relayerCredits).toBeCloseTo(0.4);
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

      // Set squad: Host 50%, Squad 50%
      broadcasterSocket.emit("update-squad", {
        streamId,
        squad: [
          { name: broadcasterUser, split: 50 },
          { name: squadUser, split: 50 }
        ]
      });

      hostReady = true;
      checkReady();
    });

    relayerSocket.on("connect", () => {
      relayerSocket.emit("register-auth", { token: relayerToken });
      relayerSocket.emit("join-stream", { streamId, username: relayerUser });

      // Report metrics to be considered an active relayer
      // Note: 10Mbps * 0.01 = 0.1 credits earned from metrics-report alone
      relayerSocket.emit("metrics-report", {
        streamId,
        latency: 50,
        uploadMbps: 10
      });

      relayerReady = true;
      checkReady();
    });

    squadSocket.on("connect", () => {
        squadSocket.emit("join-stream", { streamId, username: squadUser });
    });
  }, 10000);
});
